using System;
using System.IO;
using UnityEngine;

public sealed class GameSession
{
    private readonly GameConfig config;
    private readonly string savePath;
    private float dayAccumulator;
    private float autoSaveAccumulator;
    private float enemyDayAccumulator;

    public GameState State { get; private set; }
    public PlayerState LocalPlayer => State.GetPlayer(State.meta.localPlayerId);

    private GameSession(GameConfig config)
    {
        this.config = config;
        savePath = Path.Combine(Application.persistentDataPath, "medieval_ar_state.json");
        State = LoadOrCreateState();
        EnsureLocalPlayer();
        SeedStarterWorld();
        Save();
    }

    public static GameSession Create(GameConfig config)
    {
        return new GameSession(config);
    }

    public void Advance(float deltaTime)
    {
        if (deltaTime <= 0f)
        {
            return;
        }

        dayAccumulator += deltaTime;
        autoSaveAccumulator += deltaTime;
        State.meta.lastUtcTicks = DateTime.UtcNow.Ticks;

        while (dayAccumulator >= config.secondsPerWorldDay)
        {
            dayAccumulator -= config.secondsPerWorldDay;
            AdvanceWorldDay();
        }

        AdvanceCommanderProgress(deltaTime);

        if (autoSaveAccumulator >= config.autoSaveIntervalSeconds)
        {
            autoSaveAccumulator = 0f;
            Save();
        }
    }

    public PlayerState EnsureLocalPlayer()
    {
        if (!string.IsNullOrWhiteSpace(State.meta.localPlayerId))
        {
            var existing = State.GetPlayer(State.meta.localPlayerId);
            if (existing != null)
            {
                existing.lastSeenUtcTicks = DateTime.UtcNow.Ticks;
                existing.isLocalPlayer = true;
                EnsurePlayerDynasty(existing);
                EnsurePlayerResources(existing.playerId);
                EnsureStarterCommanders(existing);
                return existing;
            }
        }

        var player = new PlayerState
        {
            playerId = GenerateShortId("player-"),
            displayName = string.IsNullOrWhiteSpace(config.defaultPlayerName) ? "Player" : config.defaultPlayerName,
            dynastyId = GenerateShortId("dynasty-"),
            factionId = FactionCatalog.IsValid(config.defaultFactionId)
                ? config.defaultFactionId
                : FactionCatalog.GetDefaultFactionId(),
            createdUtcTicks = DateTime.UtcNow.Ticks,
            lastSeenUtcTicks = DateTime.UtcNow.Ticks,
            isLocalPlayer = true
        };

        State.players.Add(player);
        State.meta.localPlayerId = player.playerId;
        EnsurePlayerDynasty(player);
        EnsurePlayerResources(player.playerId);
        EnsureStarterCommanders(player);
        Save();
        return player;
    }

    public void SetLocalFaction(string factionId)
    {
        var player = EnsureLocalPlayer();
        var normalizedFactionId = FactionCatalog.IsValid(factionId)
            ? factionId
            : FactionCatalog.GetDefaultFactionId();

        if (!string.Equals(player.factionId, normalizedFactionId, StringComparison.OrdinalIgnoreCase))
        {
            player.factionId = normalizedFactionId;
            var dynasty = EnsurePlayerDynasty(player);
            dynasty.factionId = normalizedFactionId;
            player.lastSeenUtcTicks = DateTime.UtcNow.Ticks;
            Save();
        }
    }

    public ResourcePoolState EnsurePlayerResources(string ownerId)
    {
        var pool = State.GetResourcePool(ownerId);
        if (pool != null)
        {
            return pool;
        }

        pool = new ResourcePoolState
        {
            ownerId = ownerId,
            food = config.startingFood,
            wood = config.startingWood,
            stone = config.startingStone,
            iron = config.startingIron
        };

        State.resourcePools.Add(pool);
        return pool;
    }

    public CommanderState GetPrimaryCommander()
    {
        var localPlayer = EnsureLocalPlayer();
        for (var i = 0; i < State.commanders.Count; i++)
        {
            if (State.commanders[i] != null && string.Equals(State.commanders[i].ownerPlayerId, localPlayer.playerId, StringComparison.OrdinalIgnoreCase))
            {
                return State.commanders[i];
            }
        }

        return null;
    }

    public void Save()
    {
        NormalizeState();
        var json = JsonUtility.ToJson(new GameStateWrapper(State), true);
        File.WriteAllText(savePath, json);
    }

    private GameState LoadOrCreateState()
    {
        if (File.Exists(savePath))
        {
            try
            {
                var json = File.ReadAllText(savePath);
                var wrapper = JsonUtility.FromJson<GameStateWrapper>(json);
                if (wrapper != null && wrapper.state != null)
                {
                    var loadedState = wrapper.state;
                    NormalizeState(loadedState);
                    return loadedState;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"Failed to load save: {ex.Message}");
            }
        }

        var state = new GameState();
        state.meta.lastUtcTicks = DateTime.UtcNow.Ticks;
        state.meta.totalGameDays = 0f;
        state.meta.worldSeed = UnityEngine.Random.Range(int.MinValue, int.MaxValue);
        NormalizeState(state);
        return state;
    }

    private void SeedStarterWorld()
    {
        var localPlayer = EnsureLocalPlayer();
        var dynasty = EnsurePlayerDynasty(localPlayer);
        EnsureStarterEnemyHouses();

        if (State.routeNodes.Count == 0)
        {
            State.routeNodes.Add(new RouteNodeState
            {
                nodeId = "node-public-plaza",
                displayName = "Public Plaza",
                latitude = 0,
                longitude = 0,
                isPublicAccess = true
            });

            State.routeNodes.Add(new RouteNodeState
            {
                nodeId = "node-market-crossing",
                displayName = "Market Crossing",
                latitude = 0.001,
                longitude = 0.001,
                isPublicAccess = true
            });
        }

        if (State.routeSegments.Count == 0)
        {
            State.routeSegments.Add(new RouteSegmentState
            {
                segmentId = "segment-main-road",
                fromNodeId = "node-public-plaza",
                toNodeId = "node-market-crossing",
                distanceMeters = 850f,
                terrainMultiplier = 1f,
                travelMultiplier = 1f,
                isBridge = false,
                isRoad = true
            });
        }

        if (State.territories.Count == 0)
        {
            State.territories.Add(new TerritoryState
            {
                territoryId = "territory-home",
                ownerPlayerId = localPlayer.playerId,
                x = 0f,
                z = 0f,
                claimStrength = 1f,
                decayMultiplier = 1f
            });
        }

        if (State.commanders.Count == 0)
        {
            EnsureStarterCommanders(localPlayer);
        }

        if (State.armies.Count == 0)
        {
            EnsureStarterArmy(localPlayer, dynasty);
        }
    }

    private DynastyState EnsurePlayerDynasty(PlayerState player)
    {
        if (player == null)
        {
            return null;
        }

        var existing = State.GetDynasty(player.dynastyId);
        if (existing != null)
        {
            return existing;
        }

        var dynasty = new DynastyState
        {
            dynastyId = player.dynastyId,
            ownerPlayerId = player.playerId,
            displayName = $"{config.defaultDynastyPrefix} {player.displayName}",
            factionId = player.factionId,
            prestige = 0,
            legitimacy = 100
        };

        State.dynasties.Add(dynasty);
        return dynasty;
    }

    private void EnsureStarterEnemyHouses()
    {
        if (State.enemyHouses.Count > 0)
        {
            return;
        }

        var factions = new[]
        {
            "mongol-khanate",
            "abbasid-caliphate",
            "byzantine-empire",
            "khazar-khaganate"
        };

        for (var i = 0; i < config.startingEnemyHouses; i++)
        {
            var factionId = factions[i % factions.Length];
            var enemyHouse = new EnemyHouseState
            {
                enemyHouseId = GenerateShortId("enemy-"),
                displayName = $"House {i + 2}",
                factionId = factionId,
                homeTerritoryId = i == 0 ? "territory-home" : string.Empty,
                threatLevel = Mathf.Clamp(Mathf.RoundToInt(config.enemyStartingArmyStrength * 10f), 1, 10),
                aggression = config.enemyHouseAggression,
                expansionism = config.enemyHouseExpansionism,
                lastActionUtcTicks = DateTime.UtcNow.Ticks
            };

            State.enemyHouses.Add(enemyHouse);
        }
    }

    private void EnsureStarterCommanders(PlayerState player)
    {
        if (player == null)
        {
            return;
        }

        if (GetPrimaryCommander() != null)
        {
            return;
        }

        State.commanders.Add(CommanderCatalog.CreateStarterCommander(player.playerId, $"{player.displayName} I", CommanderRoleType.FieldCommander, State.meta.worldSeed));
    }

    private void EnsureStarterArmy(PlayerState player, DynastyState dynasty)
    {
        if (player == null || dynasty == null)
        {
            return;
        }

        var commander = GetPrimaryCommander();
        if (commander == null)
        {
            return;
        }

        var army = ArmySystem.CreateArmy(player.playerId, commander.commanderId, $"{player.displayName}'s Retinue", "node-public-plaza");
        army.isGarrison = true;
        State.armies.Add(army);
        commander.assignedArmyId = army.armyId;

        var company = ArmySystem.CreateCompany(player.playerId, army.armyId, commander.commanderId, "First Company");
        State.companies.Add(company);
        army.companyIds.Add(company.companyId);
        commander.assignedCompanyId = company.companyId;

        var banner = ArmySystem.CreateBanner(player.playerId, company.companyId, commander.commanderId, 25);
        State.banners.Add(banner);
        company.bannerIds.Add(banner.bannerId);
        commander.assignedBannerId = banner.bannerId;
    }

    private void AdvanceWorldDay()
    {
        State.meta.totalGameDays += 1f;
        enemyDayAccumulator += 1f;

        for (var i = 0; i < State.territories.Count; i++)
        {
            var territory = State.territories[i];
            territory.decayMultiplier = Mathf.Max(0f, territory.decayMultiplier - 0.01f);
        }

        for (var i = 0; i < State.resourcePools.Count; i++)
        {
            var pool = State.resourcePools[i];
            pool.food = Mathf.Max(0, pool.food - 1);
        }

        if (enemyDayAccumulator >= config.enemyActionIntervalDays)
        {
            enemyDayAccumulator = 0f;
            AdvanceEnemyHouses();
        }
    }

    private void AdvanceEnemyHouses()
    {
        for (var i = 0; i < State.enemyHouses.Count; i++)
        {
            var enemyHouse = State.enemyHouses[i];
            if (enemyHouse == null)
            {
                continue;
            }

            enemyHouse.lastActionUtcTicks = DateTime.UtcNow.Ticks;
            enemyHouse.threatLevel = Mathf.Clamp(enemyHouse.threatLevel + 1, 1, 20);

            if (enemyHouse.aggression >= 0.5f)
            {
                GrowEnemyPressure(enemyHouse);
            }
            else
            {
                FortifyEnemyHoldings(enemyHouse);
            }
        }
    }

    private void GrowEnemyPressure(EnemyHouseState enemyHouse)
    {
        var target = TerritorySystem.FindClosestTerritory(State, 0f, 0f);
        if (target == null)
        {
            return;
        }

        target.claimStrength = Mathf.Max(0.5f, target.claimStrength - config.enemyHouseAggression * 0.05f);
        target.decayMultiplier = Mathf.Clamp01(target.decayMultiplier - 0.01f);
        target.ownerEnemyHouseId = enemyHouse.enemyHouseId;
    }

    private void FortifyEnemyHoldings(EnemyHouseState enemyHouse)
    {
        var territory = GetOrCreateEnemyHomeTerritory(enemyHouse);
        territory.claimStrength = Mathf.Clamp(territory.claimStrength + 0.1f * config.enemyStartingTerritoryStrength, 0f, 10f);
        territory.decayMultiplier = Mathf.Clamp01(territory.decayMultiplier + 0.01f);
    }

    private TerritoryState GetOrCreateEnemyHomeTerritory(EnemyHouseState enemyHouse)
    {
        if (!string.IsNullOrWhiteSpace(enemyHouse.homeTerritoryId))
        {
            var existing = State.GetTerritory(enemyHouse.homeTerritoryId);
            if (existing != null)
            {
                return existing;
            }
        }

        var territory = new TerritoryState
        {
            territoryId = GenerateShortId("territory-"),
            ownerEnemyHouseId = enemyHouse.enemyHouseId,
            x = UnityEngine.Random.Range(-500f, 500f),
            z = UnityEngine.Random.Range(-500f, 500f),
            claimStrength = config.enemyStartingTerritoryStrength,
            decayMultiplier = 1f
        };

        State.territories.Add(territory);
        enemyHouse.homeTerritoryId = territory.territoryId;
        return territory;
    }

    private void AdvanceCommanderProgress(float deltaTime)
    {
        var commander = GetPrimaryCommander();
        if (commander == null)
        {
            return;
        }

        CommanderCatalog.AdvanceCommander(commander, deltaTime * 0.5f);
    }

    private void NormalizeState()
    {
        NormalizeState(State);
    }

    private static void NormalizeState(GameState state)
    {
        if (state.meta == null)
        {
            state.meta = new MetaState();
        }

        state.players ??= new System.Collections.Generic.List<PlayerState>();
        state.dynasties ??= new System.Collections.Generic.List<DynastyState>();
        state.enemyHouses ??= new System.Collections.Generic.List<EnemyHouseState>();
        state.territories ??= new System.Collections.Generic.List<TerritoryState>();
        state.resourcePools ??= new System.Collections.Generic.List<ResourcePoolState>();
        state.routeNodes ??= new System.Collections.Generic.List<RouteNodeState>();
        state.routeSegments ??= new System.Collections.Generic.List<RouteSegmentState>();
        state.caravans ??= new System.Collections.Generic.List<CaravanState>();
        state.commanders ??= new System.Collections.Generic.List<CommanderState>();
        state.armies ??= new System.Collections.Generic.List<ArmyState>();
        state.companies ??= new System.Collections.Generic.List<CompanyState>();
        state.banners ??= new System.Collections.Generic.List<BannerState>();

        for (var i = 0; i < state.players.Count; i++)
        {
            if (state.players[i] != null)
            {
                state.players[i].isLocalPlayer = state.meta.localPlayerId != null &&
                                                 string.Equals(state.players[i].playerId, state.meta.localPlayerId, StringComparison.OrdinalIgnoreCase);
            }
        }
    }

    private static string GenerateShortId(string prefix)
    {
        var id = Guid.NewGuid().ToString("N");
        if (id.Length > 12)
        {
            id = id.Substring(0, 12);
        }

        return prefix + id;
    }

    [Serializable]
    private sealed class GameStateWrapper
    {
        public GameState state;

        public GameStateWrapper(GameState state)
        {
            this.state = state;
        }
    }
}
