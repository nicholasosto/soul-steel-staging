/// <reference types="@rbxts/types" />

/**
 * @file        AttributesService.ts
 * @module      AttributesService
 * @layer       Server/Services
 * @classType   Singleton
 * @description Validates and mutates player attribute values.
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

/* =============================================== Imports ===================== */
import { AttributeKey, clampAttr } from "shared/definitions/ProfileDefinitions/Attributes";
import { ServerSignalHelpers } from "shared/network";
import { ProfileDataMap } from "shared/definitions";

/* =============================================== Service ===================== */
export class AttributesService {
	private static _instance: AttributesService | undefined;
	private readonly _playerProfiles = new Map<Player, ProfileDataMap>();

	private constructor() {
		print("AttributesService initialized.");
		this._setupSignalListeners();
	}

	public static Start(): AttributesService {
		if (this._instance === undefined) {
			this._instance = new AttributesService();
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
		ServerSignalHelpers.Connect("PlayerProfileUpdated", (player: Player, key: any, data: any) => {
			const profileData = this._playerProfiles.get(player);
			if (profileData) {
				(profileData as any)[key] = data;
			}
		});

		// Listen for profile unloaded events
		ServerSignalHelpers.Connect("PlayerProfileUnloaded", (player: Player) => {
			this._playerProfiles.delete(player);
		});

		// Listen for attribute increase requests
		ServerSignalHelpers.Connect("AttributeIncreaseRequested", (player: Player, key: AttributeKey, amount: number) => {
			AttributesService.Increase(player, key, amount);
		});
	}

	public static Increase(player: Player, key: AttributeKey, amount: number) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		if (!profileData) {
			warn(`No profile found for player ${player.Name} when increasing attribute ${key}`);
			return;
		}
		
		const attrs = profileData.Attributes;
		const newValue = clampAttr(key, attrs[key] + amount);
		const delta = newValue - attrs[key];
		if (delta === 0) return;
		
		attrs[key] = newValue;
		attrs.SpentPoints += delta;
		attrs.AvailablePoints = math.max(attrs.AvailablePoints - delta, 0);
		
		// Emit signals for the changes
		ServerSignalHelpers.Emit.PlayerProfileUpdated(player, "Attributes", attrs);
		ServerSignalHelpers.Emit.AttributeChanged(player, attrs);
		ServerSignalHelpers.Emit.ResourceRecalculationRequested(player);
	}

	public static Get(player: Player) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		return profileData?.Attributes;
	}
}

// Auto-start on import
AttributesService.Start();
