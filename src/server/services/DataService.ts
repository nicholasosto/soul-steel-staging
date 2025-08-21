/// <reference types="@rbxts/types" />

/**
 * @file        DataService.ts
 * @module      DataService
 * @layer       Server/Services
 * @description Wrapper around ProfileService for player data.
 *
 * ╭───────────────────────────────╮
 * │  Soul Steel · Coding Guide    │
 * │  Fusion v4 · Strict TS · ECS  │
 * ╰───────────────────────────────╯
 *
 * @author       Trembus
 * @license      MIT
 * @since        0.2.0
 * @lastUpdated  2025-06-25 by Trembus – Initial creation
 */

/* =============================================== Imports ====================================================== */
import { Players } from "@rbxts/services";
import ProfileService from "@rbxts/profileservice";
import { Profile } from "@rbxts/profileservice/globals";
// DTO
import { AbilityKey, DefaultAttributes, DefaultSettings, ProfileDataMap } from "shared/definitions";
import { CodeSettings } from "shared/constants/CodeSettings";
import { DefaultProgression } from "shared/definitions/ProfileDefinitions/Progression";
import { ServerSignalHelpers } from "shared/network/ServerSignals";

/* ========================================== Profile Store Setup =============================================== */

// Datastore Name
const DATASTORE_NAME = "A_SoulSteelPlayerProfile";

const DefaultProfileData: ProfileDataMap = {
	// Player Profile Data
	Abilities: ["earthquake", "fireball", "ice_shard"] as AbilityKey[], // Default abilities
	Attributes: DefaultAttributes, // Player attributes
	Progression: DefaultProgression, // Player progression data
	Settings: DefaultSettings,
};

/* Data Profile Controller */
export class DataProfileController {
	/* Singleton Instance */
	private static _instance: DataProfileController | undefined;

	/* ProfileService Initialization */
	private static _profileStore = ProfileService.GetProfileStore(DATASTORE_NAME, DefaultProfileData);

	/* Map to store player profiles */
	private static _profileMap = new Map<Player, Profile<ProfileDataMap>>(); // Map to store player profiles

	/* Connections */
	private static _playerAddedConnection: RBXScriptConnection | undefined;
	private static _playerRemovingConnection: RBXScriptConnection | undefined;

	/* Constructor */
	private constructor() {
		print("DataProfileController Initialized.");
	}

	/* Start */
	public static Start(): DataProfileController {
		if (this._instance === undefined) {
			this._instance = new DataProfileController();
			this._initializeConnections(); // Initialize connections
		}
		return this._instance;
	}

	/* Initialize Connections */
	private static _initializeConnections() {
		/* Player Added */
		this._playerAddedConnection?.Disconnect();
		this._playerAddedConnection = Players.PlayerAdded.Connect((player: Player) => {
			this._onPlayerJoining(player);
		});

		/* Player Removing */
		this._playerRemovingConnection?.Disconnect();
		this._playerRemovingConnection = Players.PlayerRemoving.Connect((player: Player) => {
			this._onPlayerLeaving(player);
		});
	}

	/* On Player Joining */
	private static async _onPlayerJoining(player: Player) {
		/* Create Player Key */
		const playerKey = player.Name + "_" + tostring(player.UserId);
		try {
			// Attempt to load the profile for the player
			const profile = await this._profileStore.LoadProfileAsync(playerKey);

			// Warn if the profile is nil
			if (profile === undefined) {
				warn(`ProfileService: (1) - Failed to load profile for player: ${player.Name}`);
				return;
			}

			// Store the profile in the map
			this._profileMap.set(player, profile);

			// Reconcile the profile to ensure it has the correct data structure
			profile.Reconcile();

			// Listen for logout and release events
			profile.ListenToRelease(() => {
				print(`[${player.Name}] - Profile released.`);
				this._profileMap.delete(player); // Remove the profile from the map
				// Emit signal that profile is being unloaded
				ServerSignalHelpers.Emit.PlayerProfileUnloaded(player);
			});

			// Emit signal that profile is loaded and ready
			ServerSignalHelpers.Emit.PlayerProfileLoaded(player, profile.Data);

		} catch (err) {
			warn(`ProfileService: (2) - Error loading profile for player ${player.Name}: ${err}`);
		}
		if (CodeSettings.DEBUG_DATASERVICE) {
			print(`DataProfileController._onPlayerJoining(${player.Name}) called.`, this._profileMap.get(player));
		}
	}

	/* On Player Leaving */
	private static _onPlayerLeaving(player: Player) {
		//print(`Player leaving: ${player.Name}`);
		// Emit signal before removing the profile
		ServerSignalHelpers.Emit.PlayerProfileUnloaded(player);
		this._profileMap.delete(player); // Remove the profile from the map
	}

	/* Get Profile */
	public static GetProfile(player: Player): Profile<ProfileDataMap> | undefined {
		if (CodeSettings.DEBUG_DATASERVICE) {
			print(`DataProfileController.GetProfile(${player.Name}) called.`, this._profileMap.get(player));
		}
		return this._profileMap.get(player); // Return the profile from the map
	}

	/* Update Profile Data - emit signal when profile data changes */
	public static UpdateProfileData<K extends keyof ProfileDataMap>(
		player: Player, 
		key: K, 
		data: ProfileDataMap[K]
	): boolean {
		const profile = this.GetProfile(player);
		if (!profile) {
			warn(`No profile found for player ${player.Name} when updating ${key}`);
			return false;
		}
		
		profile.Data[key] = data;
		ServerSignalHelpers.Emit.PlayerProfileUpdated(player, key, data);
		return true;
	}

	/* Get Profile Data via callback - for signal-based access */
	public static GetProfileData<K extends keyof ProfileDataMap>(
		player: Player,
		key: K,
		callback: (data: ProfileDataMap[K] | undefined) => void
	): void {
		const profile = this.GetProfile(player);
		const data = profile?.Data[key];
		callback(data);
	}
}
