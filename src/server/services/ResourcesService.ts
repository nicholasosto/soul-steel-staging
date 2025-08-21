/// <reference types="@rbxts/types" />

/**
 * @file        ResourcesService.ts
 * @module      ResourcesService
 * @layer       Server/Services
 * @classType   Singleton
 * @description Tracks player resources like Health, Mana and Stamina.
 *
 * ╭───────────────────────────────╮
 * │  Soul Steel · Coding Guide    │
 * │  Fusion v4 · Strict TS · ECS  │
 * ╰───────────────────────────────╯
 *
 * @author       Codex
 * @license      MIT
 * @since        0.2.0
 * @lastUpdated  2025-07-03 by Codex – Initial creation
 *
 * @dependencies
 *   @rbxts/services
 *   shared/definitions/Resources
 *   shared/definitions/ProfileDefinitions/Attributes
 *   ./DataService
 *   shared/calculations/ResourceCalculator
 *   shared/network/Definitions
 */

/* =============================================== Imports ===================== */
import { Players, RunService } from "@rbxts/services";
import { ResourceKey, ResourceDTO, RESOURCE_KEYS, DEFAULT_RESOURCES } from "shared/definitions/Resources";
import { DefaultAttributes, AttributesDTO } from "shared/definitions/ProfileDefinitions/Attributes";
import { ProfileDataMap } from "shared/definitions";
import { calculateResources } from "shared/calculations";
import { ServerSend } from "server/network";
import { ServerSignalHelpers } from "shared/network";

/* =============================================== Service ===================== */
export class ResourcesService {
	private static _instance: ResourcesService | undefined;
	private readonly _map = new Map<Player, Record<ResourceKey, ResourceDTO>>();
	private readonly _lastSend = new Map<Player, Map<ResourceKey, number>>();
	private readonly _playerProfiles = new Map<Player, ProfileDataMap>();

	private static heartbeat: RBXScriptConnection | undefined;

	private constructor() {
		this._setupConnections();
		this._setupSignalListeners();
	}

	public static Start(): ResourcesService {
		if (!this._instance) {
			this._instance = new ResourcesService();
		}
		return this._instance;
	}

	/* ------------------------------- Public API ------------------------------- */
	public static GetResources(player: Player): Record<ResourceKey, ResourceDTO> | undefined {
		return this.Start()._map.get(player);
	}

	public static ModifyResource(player: Player, key: ResourceKey, delta: number): boolean {
		const svc = this.Start();
		const resources = svc._map.get(player);

		// Check if the player has resources initialized
		if (!resources) return false;

		// Check if the resource key is valid
		const resourceData = resources[key];
		if (!resourceData) return false;

		// Check if the delta is zero or negative
		if (delta + resourceData.current < 0) return false;

		// Update the resource value
		const newResourceCurrent = math.clamp(resourceData.current + delta, 0, resourceData.max);

		resourceData.current = newResourceCurrent;

		// Send updated resource data to the player
		svc._send(player, key, resourceData);

		// Emit signal that resource changed
		ServerSignalHelpers.Emit.ResourceChanged(player, key, resourceData);

		return true;
	}

	public static Recalculate(player: Player) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		if (!profileData) {
			warn(`No profile data found for player ${player.Name} for resource recalculation`);
			return;
		}

		const attrs: AttributesDTO = profileData.Attributes ?? DefaultAttributes;
		const level = (profileData as unknown as { Level?: number })?.Level ?? 1;

		const current = svc._map.get(player);
		const snapshot = calculateResources(attrs, level, current);
		svc._map.set(player, snapshot);

		(RESOURCE_KEYS as readonly ResourceKey[]).forEach((key) => {
			svc._send(player, key, snapshot[key]);
			// Emit signal that resource changed
			ServerSignalHelpers.Emit.ResourceChanged(player, key, snapshot[key]);
		});
	}

	/* ------------------------------- Internal -------------------------------- */
	private _setupSignalListeners() {
		// Listen for profile loaded events
		ServerSignalHelpers.Connect("PlayerProfileLoaded", (player: Player, profileData: ProfileDataMap) => {
			this._playerProfiles.set(player, profileData);
			this._onProfileLoaded(player, profileData);
		});

		// Listen for profile updated events
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ServerSignalHelpers.Connect("PlayerProfileUpdated", (player: Player, key: any, data: any) => {
			const profileData = this._playerProfiles.get(player);
			if (profileData) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(profileData as any)[key] = data;
			}
		});

		// Listen for profile unloaded events
		ServerSignalHelpers.Connect("PlayerProfileUnloaded", (player: Player) => {
			this._playerProfiles.delete(player);
		});

		// Listen for resource recalculation requests
		ServerSignalHelpers.Connect("ResourceRecalculationRequested", (player: Player) => {
			ResourcesService.Recalculate(player);
		});

		// Listen for resource modification requests
		ServerSignalHelpers.Connect(
			"ResourceModificationRequested",
			(player: Player, key: ResourceKey, delta: number, source: string) => {
				const success = ResourcesService.ModifyResource(player, key, delta);
				if (!success) {
					warn(`Failed to modify resource ${key} for player ${player.Name} from source: ${source}`);
				}
			},
		);
	}
	private _setupConnections() {
		Players.PlayerAdded.Connect((p) => this._onJoin(p));
		Players.PlayerRemoving.Connect((p) => this._onLeave(p));
		Players.GetPlayers().forEach((p) => this._onJoin(p));

		/* Heartbeat Connection */
		ResourcesService.heartbeat?.Disconnect();
		let lastHeartbeat = tick();
		ResourcesService.heartbeat = RunService.Heartbeat.Connect(() => {
			if (tick() - lastHeartbeat < 1) return; // Prevent too frequent updates
			lastHeartbeat = tick();
			// Periodically sync and regenerate resources for all players
			Players.GetPlayers().forEach((player) => {
				const resources = this._map.get(player);
				if (!resources) return;
				const character = player.Character;
				const humanoid = character?.FindFirstChildOfClass("Humanoid") as Humanoid | undefined;
				if (humanoid) {
					if (humanoid.Health !== resources.Health.current) {
						humanoid.Health = resources.Health.current;
					}
					if (humanoid.MaxHealth !== resources.Health.max) {
						humanoid.MaxHealth = resources.Health.max;
					}
				}

				// Regenerate resources over time
				(RESOURCE_KEYS as ReadonlyArray<ResourceKey>).forEach((key) => {
					const data = resources[key];
					if (data.current < data.max) {
						data.current = math.min(data.current + 1, data.max); // Regenerate resources over time
						this._send(player, key, data);
						ServerSignalHelpers.Emit.ResourceChanged(player, key, data);
					}
				});
			});
		});
		// heartbeat ready
	}

	private _onJoin(player: Player) {
		// The actual resource initialization will happen when profile is loaded via signal
		// This method now only sets up basic connections
		task.defer(() => {
			const character = player.Character || player.CharacterAdded.Wait()[0];
			const humanoid = character.WaitForChild("Humanoid") as Humanoid;

			// Set up humanoid health change listener
			humanoid.HealthChanged.Connect((newHealth) => {
				const res = this._map.get(player);
				if (!res) return;
				const healthData = res["Health"];
				healthData.current = newHealth;
				this._send(player, "Health", healthData);
				ServerSignalHelpers.Emit.ResourceChanged(player, "Health", healthData);
			});
		});
	}

	private _onProfileLoaded(player: Player, profileData: ProfileDataMap) {
		task.defer(() => {
			const character = player.Character || player.CharacterAdded.Wait()[0];
			const humanoid = character.WaitForChild("Humanoid") as Humanoid;

			const attrs: AttributesDTO = profileData.Attributes ?? DefaultAttributes;
			const level = (profileData as unknown as { Level?: number })?.Level ?? 1;

			const resources = calculateResources(attrs, level);
			this._map.set(player, resources);

			humanoid.MaxHealth = resources.Health.max;
			humanoid.Health = resources.Health.current;

			(RESOURCE_KEYS as readonly ResourceKey[]).forEach((key) => {
				this._send(player, key, resources[key]);
				ServerSignalHelpers.Emit.ResourceChanged(player, key, resources[key]);
			});
		});
	}

	private _onLeave(player: Player) {
		this._map.delete(player);
		this._lastSend.delete(player);
	}

	/**
	 * Send a throttled ResourceUpdated event to the client.
	 * @param player - Target player.
	 * @param key - Resource identifier.
	 * @param data - Resource snapshot to send.
	 */
	private _send(player: Player, key: ResourceKey, data: ResourceDTO) {
		const now = tick();
		let map = this._lastSend.get(player);
		if (!map) {
			map = new Map<ResourceKey, number>();
			this._lastSend.set(player, map);
		}
		const last = map.get(key) ?? 0;
		if (now - last >= 0.1) {
			map.set(key, now);
			ServerSend.ResourceUpdated(player, key, data);
		}
	}
}

// Auto-start on import
ResourcesService.Start();
