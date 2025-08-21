/// <reference types="@rbxts/types" />

/**
 * @file        ServerSignals.ts
 * @module      ServerSignals
 * @layer       Shared/Network
 * @description Server-to-server signal definitions for decoupled service communication.
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
 *   @rbxts/signal
 *   shared/definitions
 */

/* =============================================== Imports =============================================== */
import Signal = require("@rbxts/signal");
import {
	AttributeKey,
	ResourceKey,
	AbilityKey,
	ProfileDataMap,
	ProfileDataKey,
	ResourceDTO,
	AttributesDTO,
} from "shared/definitions";

/* =============================================== Signal Definitions =============================================== */

/**
 * Data-related signals
 */
export interface DataSignals {
	/** Fired when a player's profile is loaded and ready */
	PlayerProfileLoaded: Signal<(player: Player, profileData: ProfileDataMap) => void>;
	/** Fired when a player's profile data changes */
	PlayerProfileUpdated: Signal<(player: Player, key: ProfileDataKey, data: ProfileDataMap[ProfileDataKey]) => void>;
	/** Fired when a player leaves and profile should be cleaned up */
	PlayerProfileUnloaded: Signal<(player: Player) => void>;
}

/**
 * Resource-related signals
 */
export interface ResourceSignals {
	/** Request to recalculate a player's resources based on current attributes */
	ResourceRecalculationRequested: Signal<(player: Player) => void>;
	/** Fired when a player's resource values change */
	ResourceChanged: Signal<(player: Player, key: ResourceKey, data: ResourceDTO) => void>;
	/** Request to modify a specific resource */
	ResourceModificationRequested: Signal<(player: Player, key: ResourceKey, delta: number, source: string) => void>;
}

/**
 * Attribute-related signals
 */
export interface AttributeSignals {
	/** Fired when player attributes change */
	AttributeChanged: Signal<(player: Player, attributes: AttributesDTO) => void>;
	/** Request to increase an attribute */
	AttributeIncreaseRequested: Signal<(player: Player, key: AttributeKey, amount: number) => void>;
}

/**
 * Ability-related signals
 */
export interface AbilitySignals {
	/** Request to validate if an ability can be activated */
	AbilityActivationRequested: Signal<(player: Player, abilityKey: AbilityKey, callback: (success: boolean) => void) => void>;
	/** Fired when an ability is successfully activated */
	AbilityActivated: Signal<(player: Player, abilityKey: AbilityKey) => void>;
}

/**
 * Combined server signals interface
 */
export interface ServerSignals extends DataSignals, ResourceSignals, AttributeSignals, AbilitySignals {}

/* =============================================== Signal Registry =============================================== */

/**
 * Central registry for all server-to-server signals
 */
class ServerSignalRegistry {
	private static _instance: ServerSignalRegistry | undefined;
	private _signals: Partial<ServerSignals> = {};

	private constructor() {
		this._initializeSignals();
	}

	public static GetInstance(): ServerSignalRegistry {
		if (!this._instance) {
			this._instance = new ServerSignalRegistry();
		}
		return this._instance;
	}

	private _initializeSignals() {
		// Data signals
		this._signals.PlayerProfileLoaded = new Signal();
		this._signals.PlayerProfileUpdated = new Signal();
		this._signals.PlayerProfileUnloaded = new Signal();

		// Resource signals
		this._signals.ResourceRecalculationRequested = new Signal();
		this._signals.ResourceChanged = new Signal();
		this._signals.ResourceModificationRequested = new Signal();

		// Attribute signals
		this._signals.AttributeChanged = new Signal();
		this._signals.AttributeIncreaseRequested = new Signal();

		// Ability signals
		this._signals.AbilityActivationRequested = new Signal();
		this._signals.AbilityActivated = new Signal();
	}

	public GetSignal<K extends keyof ServerSignals>(signalName: K): ServerSignals[K] {
		const signal = this._signals[signalName];
		if (!signal) {
			error(`Signal ${signalName} not found in registry`);
		}
		return signal;
	}
}

/* =============================================== Public API =============================================== */

const signalRegistry = ServerSignalRegistry.GetInstance();

/**
 * Get a server signal by name
 */
export function GetServerSignal<K extends keyof ServerSignals>(signalName: K): ServerSignals[K] {
	return signalRegistry.GetSignal(signalName);
}

/**
 * Convenience methods for common signal operations
 */
export const ServerSignalHelpers = {
	/**
	 * Get the signal registry instance
	 */
	GetRegistry(): ServerSignalRegistry {
		return signalRegistry;
	},

	/**
	 * Connect to a signal
	 */
	Connect<K extends keyof ServerSignals>(
		signalName: K,
		callback: any
	): RBXScriptConnection {
		const signal = GetServerSignal(signalName) as unknown;
		return (signal as { Connect: (cb: any) => RBXScriptConnection }).Connect(callback);
	},

	/**
	 * Connect to a signal once
	 */
	Once<K extends keyof ServerSignals>(
		signalName: K,
		callback: any
	): RBXScriptConnection {
		const signal = GetServerSignal(signalName) as unknown;
		return (signal as { Once: (cb: any) => RBXScriptConnection }).Once(callback);
	},

	/**
	 * Emit signals - specific methods for type safety
	 */
	Emit: {
		PlayerProfileLoaded(player: Player, profileData: ProfileDataMap) {
			GetServerSignal("PlayerProfileLoaded").Fire(player, profileData);
		},
		PlayerProfileUpdated(player: Player, key: ProfileDataKey, data: any) {
			GetServerSignal("PlayerProfileUpdated").Fire(player, key, data);
		},
		PlayerProfileUnloaded(player: Player) {
			GetServerSignal("PlayerProfileUnloaded").Fire(player);
		},
		ResourceRecalculationRequested(player: Player) {
			GetServerSignal("ResourceRecalculationRequested").Fire(player);
		},
		ResourceChanged(player: Player, key: ResourceKey, data: ResourceDTO) {
			GetServerSignal("ResourceChanged").Fire(player, key, data);
		},
		ResourceModificationRequested(player: Player, key: ResourceKey, delta: number, source: string) {
			GetServerSignal("ResourceModificationRequested").Fire(player, key, delta, source);
		},
		AttributeChanged(player: Player, attributes: AttributesDTO) {
			GetServerSignal("AttributeChanged").Fire(player, attributes);
		},
		AttributeIncreaseRequested(player: Player, key: AttributeKey, amount: number) {
			GetServerSignal("AttributeIncreaseRequested").Fire(player, key, amount);
		},
		AbilityActivationRequested(player: Player, abilityKey: AbilityKey, callback: (success: boolean) => void) {
			GetServerSignal("AbilityActivationRequested").Fire(player, abilityKey, callback);
		},
		AbilityActivated(player: Player, abilityKey: AbilityKey) {
			GetServerSignal("AbilityActivated").Fire(player, abilityKey);
		},
	}
};