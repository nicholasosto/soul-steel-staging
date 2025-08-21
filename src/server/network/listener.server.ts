import { DataProfileController } from "server/services";
import { ClientDispatch, ProfileDataKey } from "shared";

const Functions = {
	/* -- Profile Data -- */
	GetProfileData: ClientDispatch.Server.Get("GetData"),
};

/* --- Listeners --- */
Functions.GetProfileData.SetCallback((player: Player, key: ProfileDataKey) => {
	// Note: Direct DataService access is acceptable here as this is a network callback
	// that needs to return profile data synchronously to the client
	const profile = DataProfileController.GetProfile(player);
	if (profile) {
		const data = profile.Data[key];
		if (data !== undefined) {
			return data;
		} else {
			warn(`GetProfileData: Key "${key}" not found in profile for player ${player.Name}.`);
			return undefined;
		}
	} else {
		warn(`GetProfileData: No profile found for player ${player.Name}.`);
		return undefined;
	}
});
