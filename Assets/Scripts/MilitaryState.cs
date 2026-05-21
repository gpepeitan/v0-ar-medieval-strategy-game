using System;
using System.Collections.Generic;

public enum CommanderRoleType
{
    FieldCommander,
    LogisticsExpert,
    DefensiveMarshal,
    SiegeMaster,
    CavalryLeader
}

public enum CommanderStatusType
{
    Active,
    Wounded,
    Captured,
    Killed,
    Retired,
    Reassigned
}

[Serializable]
public sealed class CommanderStats
{
    public int tactics;
    public int leadership;
    public int logistics;
    public int cavalry;
    public int infantry;
    public int siege;
    public int naval;
}

[Serializable]
public sealed class CommanderState
{
    public string commanderId;
    public string ownerPlayerId;
    public string displayName;
    public CommanderRoleType roleType;
    public CommanderStatusType status = CommanderStatusType.Active;
    public CommanderStats stats = new CommanderStats();
    public float experience;
    public float hiddenTalent;
    public string assignedArmyId;
    public string assignedCompanyId;
    public string assignedBannerId;
    public long createdUtcTicks;
    public long lastActionUtcTicks;
    public int victories;
    public int defeats;
}

[Serializable]
public sealed class BannerState
{
    public string bannerId;
    public string ownerPlayerId;
    public string commanderId;
    public string companyId;
    public int soldierCount;
    public float morale = 0.75f;
    public float readiness = 0.75f;
    public float supplyDays = 3f;
    public string formationName = "Line";
    public bool isActive = true;
}

[Serializable]
public sealed class CompanyState
{
    public string companyId;
    public string ownerPlayerId;
    public string armyId;
    public string commanderId;
    public List<string> bannerIds = new List<string>();
    public string label;
    public float morale = 0.75f;
    public float supplyDays = 5f;
    public float cohesion = 0.75f;
    public string currentRouteSegmentId;
    public string currentNodeId;
}

[Serializable]
public sealed class ArmyState
{
    public string armyId;
    public string ownerPlayerId;
    public string commanderId;
    public List<string> companyIds = new List<string>();
    public string label;
    public string routeSegmentId;
    public string currentNodeId;
    public string destinationNodeId;
    public float routeProgress01;
    public float morale = 0.75f;
    public float supplyDays = 7f;
    public float cohesion = 0.75f;
    public bool isGarrison = true;
    public long lastUpdatedUtcTicks;
}
