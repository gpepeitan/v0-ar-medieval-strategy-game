using System;

public static class CommanderCatalog
{
    public static CommanderState CreateStarterCommander(string ownerPlayerId, string displayName, CommanderRoleType roleType, int seed)
    {
        var rng = new Random(seed);
        var commander = new CommanderState
        {
            commanderId = GenerateShortId("cmdr-"),
            ownerPlayerId = ownerPlayerId,
            displayName = displayName,
            roleType = roleType,
            createdUtcTicks = DateTime.UtcNow.Ticks,
            lastActionUtcTicks = DateTime.UtcNow.Ticks,
            hiddenTalent = (float)(0.65 + rng.NextDouble() * 0.35)
        };

        commander.stats.tactics = RollStat(rng, 30, 85);
        commander.stats.leadership = RollStat(rng, 30, 85);
        commander.stats.logistics = RollStat(rng, 30, 85);
        commander.stats.cavalry = RollStat(rng, 20, 90);
        commander.stats.infantry = RollStat(rng, 20, 90);
        commander.stats.siege = RollStat(rng, 20, 90);
        commander.stats.naval = RollStat(rng, 10, 80);

        ApplyRoleBias(commander, roleType);
        return commander;
    }

    public static void AdvanceCommander(CommanderState commander, float experienceGain)
    {
        if (commander == null || experienceGain <= 0f)
        {
            return;
        }

        commander.experience += experienceGain * commander.hiddenTalent;
        var levelsGained = (int)(commander.experience / 100f);
        if (levelsGained <= 0)
        {
            return;
        }

        commander.experience -= levelsGained * 100f;
        commander.stats.tactics += levelsGained;
        commander.stats.leadership += levelsGained;
        commander.stats.logistics += levelsGained;
    }

    public static float GetCommandQuality(CommanderState commander)
    {
        if (commander == null)
        {
            return 0f;
        }

        var total = commander.stats.tactics + commander.stats.leadership + commander.stats.logistics + commander.stats.cavalry + commander.stats.infantry + commander.stats.siege + commander.stats.naval;
        return total / 7f;
    }

    private static void ApplyRoleBias(CommanderState commander, CommanderRoleType roleType)
    {
        switch (roleType)
        {
            case CommanderRoleType.LogisticsExpert:
                commander.stats.logistics += 18;
                commander.stats.leadership += 8;
                break;
            case CommanderRoleType.DefensiveMarshal:
                commander.stats.leadership += 12;
                commander.stats.infantry += 12;
                break;
            case CommanderRoleType.SiegeMaster:
                commander.stats.siege += 18;
                commander.stats.tactics += 8;
                break;
            case CommanderRoleType.CavalryLeader:
                commander.stats.cavalry += 18;
                commander.stats.tactics += 8;
                break;
            case CommanderRoleType.FieldCommander:
            default:
                commander.stats.tactics += 10;
                commander.stats.leadership += 10;
                break;
        }
    }

    private static int RollStat(Random rng, int min, int max)
    {
        return rng.Next(min, max + 1);
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
}
