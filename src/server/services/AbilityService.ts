/// <reference types="@rbxts/types" />

/**
 * @file        AbilityService.ts
 * @module      AbilityService
 * @layer       Server/Services
 * @classType   Singleton
 * @description Manages player abilities and activation cooldowns.
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
 */

/* =============================================== Imports =============================================== */
import { AbilitiesMeta, AbilityKey, loadAnimation, playAnimation } from "shared";
import { CooldownTimer } from "shared/classes/CooldownTimer";
import { ServerSignalHelpers } from "shared/network";
import { ProfileDataMap, ResourceKey } from "shared/definitions";

/* =============================================== Service =============================================== */
export class AbilityService {
	private static _instance: AbilityService | undefined;
	private readonly _cooldowns = new Map<Player, Map<AbilityKey, CooldownTimer>>();
	private readonly _playerProfiles = new Map<Player, ProfileDataMap>();

	private constructor() {
		print("AbilityService initialized.");
		this._setupSignalListeners();
	}

	public static Start(): AbilityService {
		if (!this._instance) {
			this._instance = new AbilityService();
		}
		return this._instance;
	}

	/* ------------------------------- Internal -------------------------------- */
	private _setupSignalListeners() {
		// Listen for profile loaded events
		ServerSignalHelpers.Connect("PlayerProfileLoaded", (player: Player, profileData: ProfileDataMap) => {
			this._playerProfiles.set(player, profileData);
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
			this._cooldowns.delete(player);
		});
	}

	/* ------------------------------- Mutator Methods ------------------------------- */
	public static SetAbilities(player: Player, abilities: AbilityKey[]) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		if (!profileData) {
			warn(`No profile found for player ${player.Name}.`);
			return;
		}
		profileData.Abilities = abilities;
		// Emit signal that profile data was updated
		ServerSignalHelpers.Emit.PlayerProfileUpdated(player, "Abilities", abilities);
	}

	/* ------------------------------- Ability Management ------------------------------- */
	public static AddAbility(player: Player, abilityKey: AbilityKey) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		if (!profileData) {
			warn(`No profile found for player ${player.Name}.`);
			return;
		}
		if (!profileData.Abilities.includes(abilityKey)) {
			profileData.Abilities.push(abilityKey);
			print(`Added ability ${abilityKey} to player ${player.Name}.`);
			// Emit signal that profile data was updated
			ServerSignalHelpers.Emit.PlayerProfileUpdated(player, "Abilities", profileData.Abilities);
		} else {
			warn(`Player ${player.Name} already has ability ${abilityKey}.`);
		}
	}

	/* ------------------------------- Ability Removal ------------------------------- */
	public static RemoveAbility(player: Player, abilityKey: AbilityKey) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		if (!profileData) {
			warn(`No profile found for player ${player.Name}.`);
			return;
		}
		const abilities = profileData.Abilities;
		const index = abilities.indexOf(abilityKey);
		const removed = abilities.remove(index);
		if (removed) {
			print(`Removed ability ${abilityKey} from player ${player.Name}.`);
			// Emit signal that profile data was updated
			ServerSignalHelpers.Emit.PlayerProfileUpdated(player, "Abilities", abilities);
		} else {
			warn(`Player ${player.Name} does not have ability ${abilityKey}.`);
		}
	}

	/* ------------------------------- Ability Retrieval ------------------------------- */
	public static GetAbilities(player: Player): AbilityKey[] | undefined {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		return profileData?.Abilities;
	}

	/* ------------------------------- Ability Activation ------------------------------ */
	public static Activate(player: Player, abilityKey: AbilityKey): boolean {
		const svc = this.Start();
		const abilities = this.GetAbilities(player);
		// Check if the player has the ability
		if (!abilities || !abilities.includes(abilityKey)) {
			warn(`Player ${player.Name} does not have ability ${abilityKey}.`);
			return false;
		}

		// Get or create the cooldown map for the player
		let playerCooldowns = svc._cooldowns.get(player);
		if (!playerCooldowns) {
			playerCooldowns = new Map<AbilityKey, CooldownTimer>();
			svc._cooldowns.set(player, playerCooldowns);
		}

		// Check if the ability is already on cooldown
		const existing = playerCooldowns.get(abilityKey);
		if (existing && !existing.isReady()) {
			warn(`Ability ${abilityKey} on cooldown for player ${player.Name}.`);
			return false;
		}

		// Validate and consume resources
		if (!svc.validateAndConsumeResources(player, abilityKey)) {
			warn(`Player ${player.Name} does not have enough resources to activate ${abilityKey}.`);
			return false;
		}

		// If the ability is not on cooldown, start a new cooldown timer
		const cooldown = AbilitiesMeta[abilityKey]?.cooldown ?? 0;
		const timer = new CooldownTimer(cooldown);
		playerCooldowns.set(abilityKey, timer);
		timer.start();

		const character = player.Character || player.CharacterAdded.Wait()[0];
		loadAnimation(character, AbilitiesMeta[abilityKey].animationKey);
		playAnimation(character, AbilitiesMeta[abilityKey].animationKey);
		print(`Activated ability ${abilityKey} for player ${player.Name}.`);

		// Emit signal that ability was activated
		ServerSignalHelpers.Emit.AbilityActivated(player, abilityKey);

		return true;
	}

	private validateAndConsumeResources(player: Player, abilityKey: AbilityKey): boolean {
		const manaCost = AbilitiesMeta[abilityKey]?.cost.mana ?? 0;
		const staminaCost = AbilitiesMeta[abilityKey]?.cost.stamina ?? 0;

		// Request resource modifications via signals
		if (manaCost > 0) {
			ServerSignalHelpers.Emit.ResourceModificationRequested(player, "Mana", -manaCost, "AbilityService");
		}
		if (staminaCost > 0) {
			ServerSignalHelpers.Emit.ResourceModificationRequested(player, "Stamina", -staminaCost, "AbilityService");
		}

		// For now, assume success - in a more robust implementation,
		// you'd want to wait for confirmation from ResourcesService
		return true;
	}
}

// Auto-start on import
AbilityService.Start();
