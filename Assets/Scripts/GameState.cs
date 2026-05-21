using System;
using System.Collections.Generic;

[Serializable]
public sealed class GameState
{
    public MetaState meta = new MetaState();
    public List<PlayerState> players = new List<PlayerState>();
    public List<DynastyState> dynasties = new List<DynastyState>();
    public List<EnemyHouseState> enemyHouses = new List<EnemyHouseState>();
    public List<TerritoryState> territories = new List<TerritoryState>();
    public List<ResourcePoolState> resourcePools = new List<ResourcePoolState>();
    public List<RouteNodeState> routeNodes = new List<RouteNodeState>();
    public List<RouteSegmentState> routeSegments = new List<RouteSegmentState>();
    public List<CaravanState> caravans = new List<CaravanState>();
    public List<CommanderState> commanders = new List<CommanderState>();
    public List<ArmyState> armies = new List<ArmyState>();
    public List<CompanyState> companies = new List<CompanyState>();
    public List<BannerState> banners = new List<BannerState>();

    public PlayerState GetPlayer(string playerId)
    {
        if (string.IsNullOrWhiteSpace(playerId))
        {
            return null;
        }

        for (var i = 0; i < players.Count; i++)
        {
            if (string.Equals(players[i].playerId, playerId, StringComparison.OrdinalIgnoreCase))
            {
                return players[i];
            }
        }

        return null;
    }

    public DynastyState GetDynasty(string dynastyId)
    {
        if (string.IsNullOrWhiteSpace(dynastyId))
        {
            return null;
        }

        for (var i = 0; i < dynasties.Count; i++)
        {
            if (string.Equals(dynasties[i].dynastyId, dynastyId, StringComparison.OrdinalIgnoreCase))
            {
                return dynasties[i];
            }
        }

        return null;
    }

    public EnemyHouseState GetEnemyHouse(string enemyHouseId)
    {
        if (string.IsNullOrWhiteSpace(enemyHouseId))
        {
            return null;
        }

        for (var i = 0; i < enemyHouses.Count; i++)
        {
            if (string.Equals(enemyHouses[i].enemyHouseId, enemyHouseId, StringComparison.OrdinalIgnoreCase))
            {
                return enemyHouses[i];
            }
        }

        return null;
    }

    public TerritoryState GetTerritory(string territoryId)
    {
        if (string.IsNullOrWhiteSpace(territoryId))
        {
            return null;
        }

        for (var i = 0; i < territories.Count; i++)
        {
            if (string.Equals(territories[i].territoryId, territoryId, StringComparison.OrdinalIgnoreCase))
            {
                return territories[i];
            }
        }

        return null;
    }

    public ResourcePoolState GetResourcePool(string ownerId)
    {
        if (string.IsNullOrWhiteSpace(ownerId))
        {
            return null;
        }

        for (var i = 0; i < resourcePools.Count; i++)
        {
            if (string.Equals(resourcePools[i].ownerId, ownerId, StringComparison.OrdinalIgnoreCase))
            {
                return resourcePools[i];
            }
        }

        return null;
    }

    public RouteNodeState GetRouteNode(string nodeId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
        {
            return null;
        }

        for (var i = 0; i < routeNodes.Count; i++)
        {
            if (string.Equals(routeNodes[i].nodeId, nodeId, StringComparison.OrdinalIgnoreCase))
            {
                return routeNodes[i];
            }
        }

        return null;
    }

    public RouteSegmentState GetRouteSegment(string segmentId)
    {
        if (string.IsNullOrWhiteSpace(segmentId))
        {
            return null;
        }

        for (var i = 0; i < routeSegments.Count; i++)
        {
            if (string.Equals(routeSegments[i].segmentId, segmentId, StringComparison.OrdinalIgnoreCase))
            {
                return routeSegments[i];
            }
        }

        return null;
    }

    public CommanderState GetCommander(string commanderId)
    {
        if (string.IsNullOrWhiteSpace(commanderId))
        {
            return null;
        }

        for (var i = 0; i < commanders.Count; i++)
        {
            if (string.Equals(commanders[i].commanderId, commanderId, StringComparison.OrdinalIgnoreCase))
            {
                return commanders[i];
            }
        }

        return null;
    }

    public ArmyState GetArmy(string armyId)
    {
        if (string.IsNullOrWhiteSpace(armyId))
        {
            return null;
        }

        for (var i = 0; i < armies.Count; i++)
        {
            if (string.Equals(armies[i].armyId, armyId, StringComparison.OrdinalIgnoreCase))
            {
                return armies[i];
            }
        }

        return null;
    }

    public CompanyState GetCompany(string companyId)
    {
        if (string.IsNullOrWhiteSpace(companyId))
        {
            return null;
        }

        for (var i = 0; i < companies.Count; i++)
        {
            if (string.Equals(companies[i].companyId, companyId, StringComparison.OrdinalIgnoreCase))
            {
                return companies[i];
            }
        }

        return null;
    }

    public BannerState GetBanner(string bannerId)
    {
        if (string.IsNullOrWhiteSpace(bannerId))
        {
            return null;
        }

        for (var i = 0; i < banners.Count; i++)
        {
            if (string.Equals(banners[i].bannerId, bannerId, StringComparison.OrdinalIgnoreCase))
            {
                return banners[i];
            }
        }

        return null;
    }
}

[Serializable]
public sealed class MetaState
{
    public long lastUtcTicks;
    public float totalGameDays;
    public int worldSeed;
    public string localPlayerId;
}

[Serializable]
public sealed class PlayerState
{
    public string playerId;
    public string displayName;
    public string dynastyId;
    public string factionId;
    public long createdUtcTicks;
    public long lastSeenUtcTicks;
    public bool isLocalPlayer;
}

[Serializable]
public sealed class DynastyState
{
    public string dynastyId;
    public string ownerPlayerId;
    public string displayName;
    public string factionId;
    public int prestige;
    public int legitimacy;
}

[Serializable]
public sealed class EnemyHouseState
{
    public string enemyHouseId;
    public string displayName;
    public string factionId;
    public string homeTerritoryId;
    public int threatLevel;
    public float aggression;
    public float expansionism;
    public long lastActionUtcTicks;
}

[Serializable]
public sealed class TerritoryState
{
    public string territoryId;
    public string ownerPlayerId;
    public string ownerEnemyHouseId;
    public float x;
    public float z;
    public float claimStrength;
    public float decayMultiplier = 1f;
}

[Serializable]
public sealed class ResourcePoolState
{
    public string ownerId;
    public int food;
    public int wood;
    public int stone;
    public int iron;
}
