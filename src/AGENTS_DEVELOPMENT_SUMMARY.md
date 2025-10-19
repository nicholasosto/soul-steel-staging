# Development Summary

The table below lists core modules grouped by network layer and their current stability.

| Layer   | Module                                   | Status             | Notes |
|--------|------------------------------------------|--------------------|-------|
|Shared|`shared/network`|Rock Solid|Typed event definitions|
|Shared|`shared/data/AbilityData.ts`|Under Construction|Ability metadata|
|Shared|`shared/data/AttributeData.ts`|Rock Solid|Attribute metadata and helpers|
|Shared|`shared/data/CodonData.ts`|Rock Solid|Genetic codon constants|
|Shared|`shared/data/GemData.ts`|Under Construction|Gem DTOs|
|Shared|`shared/data/ItemData.ts`|Usable|Generic item DTO|
|Shared|`shared/data/PlayerData.ts`|Stub|Player profile template|
|Shared|`shared/data/RarityData.ts`|Rock Solid|Rarity metadata|
|Shared|`shared/data/ResourceData.ts`|Rock Solid|Resource metadata|
|Shared|`shared/definitions/Resources.ts`|Usable|Resource state helpers|
|Shared|`shared/data/RigData.ts`|Usable|Rig template references|
|Shared|`shared/assets`|Usable|Image asset constants|
|Shared|`shared/states`|Usable|Signal-based shared state|
|Shared|`theme`|Usable|Fusion theme store with Fateless theme|
|Shared|`constants`|Rock Solid|Sizes and asset ids|
|Shared|`shared/physics`|Usable|Utility forces and ropes|
|Shared|`shared/calculations/calculateResources.ts`|Usable|Derives resources from attributes|
|Client|`client/main.client.ts`|Usable|Entry point and UI bootstrap|
|Client|`client/stylesheet.client.ts`|Under Construction|StyleSheet prototype|
|Client|`client/ui/atoms`|Usable|Core UI atoms (buttons, panels)|
|Client|`client/ui/style`|Rock Solid|Tokenized layout and colors|
|Client|`client/ui/atoms/Screen/GameScreen.ts`|Usable|Base screen wrapper|
|Client|`client/ui/atoms/DragDetector/DragDetector.ts`|Usable|Drag detector atom|
|Client|`client/ui/atoms/Button/UIButton.ts`|Usable|Unified button primitive|
|Client|`client/ui/atoms/Button/DraggableButton.ts`|Usable|Wrapper preset for draggable buttons|
|Client|`client/ui/molecules/CountdownTimer.ts`|Usable|Displays battle countdown|
|Client|`client/ui/atoms/GameWindow.ts`|Usable|Panel window with title bar|
|Client|`client/ui/molecules/TitleBar.ts`|Usable|Window title bar component|
|Client|`client/ui/molecules/SettingListItem.ts`|Usable|Displays and edits a single setting|
|Client|`client/ui/molecules/ExperienceBar.ts`|Usable|Displays experience progress|
|Client|`client/ui/molecules/LevelGem.ts`|Usable|Shows current level|
|Client|`client/ui/molecules/ProgressBar.ts`|Usable|Basic progress bar|
|Client|`client/ui/molecules/BarMeter.ts`|Usable|Tokenized bar meter|
|Client|`client/ui/molecules/HUDMenuButton.ts`|Usable|HUD toggle button|
|Client|`client/ui/molecules/AbilityInfoPanel.ts`|Usable|Ability description panel|
|Client|`client/ui/organisms/UserMessage.ts`|Usable|Center-screen popup messages|
|Client|`client/states/SettingsState.ts`|Usable|Reactive settings container|
|Client|`client/network/ClientNetwork.ts`|Usable|Client RPC helpers|
|Client|`client/network/network.client.ts`|Usable|Receives server events|
|Client|`client/ui/screens`|Under Construction|Gem forge, character, inventory, shop, settings, teleport and HUD screens|
|Client|`client/ui/screens/DragDropScreen.ts`|Usable|Drag and drop demo|
|Client|`client/ui/screens/CharacterScreen.ts`|Stub|Character info window|
|Client|`client/ui/screens/InventoryScreen.ts`|Stub|Inventory window|
|Client|`client/ui/screens/ShopScreen.ts`|Stub|Item shop window|
|Client|`client/ui/screens/SettingsScreen.ts`|Stub|Settings window|
|Client|`client/ui/screens/TeleportScreen.ts`|Stub|Teleport locations window|
|Client|`client/ui/organisms/ButtonBars/AdminButtonBar.ts`|Under Construction|Admin service test buttons|
|Client|`client/ui/molecules/Button/AbilityButton.ts`|Usable|Ability icon with cooldown|
|Client|`client/ui/organisms/ProgressionCard.ts`|Usable|Level and experience UI|
|Client|`client/ui/organisms/ResourceBar.ts`|Usable|Animated bars synced to state|
|Client|`client/ui/organisms/ButtonBars/AbilityBar.ts`|Under Construction|Displays equipped abilities|
|Client|`client/states/AbilitySlice.ts`|Under Construction|Ability list and actions|
|Client|`client/states/AttributesSlice.ts`|Under Construction|Attribute values and points|
|Client|`client/states/ResourceSlice.ts`|Usable|Reactive resource values and percent|
|Client|`client/states/ProgressionSlice.ts`|Usable|Level and experience slice|
|Client|`client/states/MessageSlice.ts`|Usable|Transient user messages|
|Client|`client/states/CurrencySlice.ts`|Stub|Currency amounts|
|Server|`server/main.server.ts`|Under Construction|Joins players and loads profiles|
|Server|`server/network/listener.server.ts`|Usable|Server network handlers|
|Server|`server/services/DataService.ts`|Usable|Loads player profiles|
|Server|`server/services/ManifestationForgeService.ts`|Under Construction|Creates manifestations|
|Server|`server/services/BattleRoomService.ts`|Usable|Matchmaking and teleport skeleton|
|Server|`server/services/SettingsService.ts`|Usable|Stores player settings|
|Server|`server/entity/Manifestation.ts`|Stub|Placeholder creation logic|
|Server|`server/services/NPCService.ts`|Usable|Spawns NPCs from definitions|
|Server|`server/services/AbilityService.ts`|Under Construction|Handles ability activation and cooldowns|
|Server|`server/services/StatusEffectService.ts`|Under Construction|Refactored to use StatusEffects|
|Server|`server/services/ResourcesService.ts`|Usable|Calculates and syncs resources|
|Server|`server/services/AttributesService.ts`|Under Construction|Validates attribute changes|
|Server|`server/services/ProgressionService.ts`|Under Construction|Manages experience and level ups|
|Server|`server/entity/npc/NPC.ts`|Usable|NPC instance with random names|
|Server|`server/entity/entityResource/EntityResource.ts`|Usable|Drops collectible resource|

Keep this summary updated whenever modules are added or changed.
