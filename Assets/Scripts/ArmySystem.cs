using System;
using System.Collections.Generic;
using UnityEngine;

public static class ArmySystem
{
    public static ArmyState CreateArmy(string ownerPlayerId, string commanderId, string label, string currentNodeId)
    {
        return new ArmyState
        {
            armyId = GenerateShortId("army-"),
            ownerPlayerId = ownerPlayerId,
            commanderId = commanderId,
            label = label,
            currentNodeId = currentNodeId,
            routeProgress01 = 0f,
            morale = 0.75f,
            supplyDays = 7f,
            cohesion = 0.75f,
            isGarrison = true,
            lastUpdatedUtcTicks = DateTime.UtcNow.Ticks
        };
    }

    public static CompanyState CreateCompany(string ownerPlayerId, string armyId, string commanderId, string label)
    {
        return new CompanyState
        {
            companyId = GenerateShortId("comp-"),
            ownerPlayerId = ownerPlayerId,
            armyId = armyId,
            commanderId = commanderId,
            label = label,
            morale = 0.75f,
            supplyDays = 5f,
            cohesion = 0.75f
        };
    }

    public static BannerState CreateBanner(string ownerPlayerId, string companyId, string commanderId, int soldierCount)
    {
        return new BannerState
        {
            bannerId = GenerateShortId("bann-"),
            ownerPlayerId = ownerPlayerId,
            companyId = companyId,
            commanderId = commanderId,
            soldierCount = Mathf.Clamp(soldierCount, 1, 40),
            morale = 0.75f,
            readiness = 0.75f,
            supplyDays = 3f,
            formationName = "Line",
            isActive = true
        };
    }

    public static int EstimateSoldiers(ArmyState army, GameState state)
    {
        if (army == null || state == null)
        {
            return 0;
        }

        var total = 0;
        for (var i = 0; i < army.companyIds.Count; i++)
        {
            var company = state.GetCompany(army.companyIds[i]);
            if (company == null)
            {
                continue;
            }

            for (var j = 0; j < company.bannerIds.Count; j++)
            {
                var banner = state.GetBanner(company.bannerIds[j]);
                if (banner != null)
                {
                    total += banner.soldierCount;
                }
            }
        }

        return total;
    }

    public static float GetForceReadiness(GameState state, ArmyState army)
    {
        if (army == null || state == null)
        {
            return 0f;
        }

        var commander = state.GetCommander(army.commanderId);
        var commandFactor = commander != null ? CommanderCatalog.GetCommandQuality(commander) / 100f : 0.5f;
        var moraleFactor = Mathf.Clamp01(army.morale);
        var cohesionFactor = Mathf.Clamp01(army.cohesion);
        var supplyFactor = Mathf.Clamp01(army.supplyDays / 7f);
        return Mathf.Clamp01((commandFactor + moraleFactor + cohesionFactor + supplyFactor) / 4f);
    }

    public static void AdvanceArmy(ArmyState army, float deltaTime)
    {
        if (army == null || deltaTime <= 0f)
        {
            return;
        }

        army.lastUpdatedUtcTicks = DateTime.UtcNow.Ticks;
        army.supplyDays = Mathf.Max(0f, army.supplyDays - deltaTime * 0.01f);
        army.morale = Mathf.Clamp01(army.morale - deltaTime * 0.001f);
        army.cohesion = Mathf.Clamp01(army.cohesion - deltaTime * 0.0005f);
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
