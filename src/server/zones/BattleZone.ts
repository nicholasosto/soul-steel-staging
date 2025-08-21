import { Workspace } from "@rbxts/services";
import { ZoneBase } from "./ZoneBase";
import { PlayerHelpers } from "shared/helpers/PlayerCharacter";
import { ServerSignalHelpers } from "shared/network";

const PlayerEntered = (player: Player) => {
	const character = player.Character || player.CharacterAdded.Wait()[0];
	if (character === undefined) {
		print(`Player ${player.Name} entered the Battle Zone, but their character is not available.`);
		return;
	}

	if (character.PrimaryPart === undefined) {
		print(`Player ${player.Name} has no PrimaryPart in their character.`);
		return;
	}
	// Use signal to request resource modification instead of direct service call
	ServerSignalHelpers.Emit.ResourceModificationRequested(player, "Health", -20, "BattleZone");
};

const PlayerLeft = (player: Player) => {
	print(`Player ${player.Name} has left the Battle Zone.`);
	// Additional logic for when a player leaves the Battle Zone can be added here
};

const BattleZoneProps = {
	container: Workspace.WaitForChild("Zones").WaitForChild("BattleZone") as Part,
	onPlayerEntered: PlayerEntered,
	onPlayerExited: PlayerLeft,
};

export const BattleZoneInstance = ZoneBase(BattleZoneProps);
