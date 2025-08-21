/// <reference types="@rbxts/types" />

/**
 * @file        ProgressionService.ts
 * @module      ProgressionService
 * @layer       Server/Services
 * @classType   Singleton
 * @description Handles player experience and level progression.
 *
 * ╭───────────────────────────────╮
 * │  Soul Steel · Coding Guide    │
 * │  Fusion v4 · Strict TS · ECS  │
 * ╰───────────────────────────────╯
 *
 * @author       Codex
 * @license      MIT
 * @since        0.2.0
 * @lastUpdated  2025-07-05 by Codex – Initial creation
 */

/* =============================================== Imports ================================== */
import { getNextLevelExperience } from "shared/definitions/ProfileDefinitions/Progression";
import { ServerSignalHelpers } from "shared/network";
import { ProfileDataMap } from "shared/definitions";

/* =============================================== Service ================================== */
export class ProgressionService {
	private static _instance: ProgressionService | undefined;
	private readonly _playerProfiles = new Map<Player, ProfileDataMap>();

	private constructor() {
		print("ProgressionService initialized.");
		this._setupSignalListeners();
	}

	public static Start(): ProgressionService {
		if (this._instance === undefined) {
			this._instance = new ProgressionService();
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
	}

	/* ------------------------------- Public API ---------------------------------------- */
	public static AddExperience(player: Player, amount: number) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		if (!profileData) {
			warn(`No profile found for player ${player.Name} when adding experience`);
			return;
		}

		const progression = profileData.Progression;
		progression.Experience += amount;
		while (progression.Experience >= progression.NextLevelExperience) {
			progression.Experience -= progression.NextLevelExperience;
			progression.Level += 1;
			progression.NextLevelExperience = getNextLevelExperience(progression.Level);
		}
		
		// Emit signal that progression data was updated
		ServerSignalHelpers.Emit.PlayerProfileUpdated(player, "Progression", progression);
		
		return progression;
	}

	public static Get(player: Player) {
		const svc = this.Start();
		const profileData = svc._playerProfiles.get(player);
		return profileData?.Progression;
	}
}

// Auto-start on import
ProgressionService.Start();
