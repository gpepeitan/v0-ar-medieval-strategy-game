using System;
using System.Collections.Generic;
using UnityEngine;

public static class TerritorySystem
{
    public static TerritoryState FindClosestTerritory(GameState state, float x, float z)
    {
        if (state == null || state.territories.Count == 0)
        {
            return null;
        }

        TerritoryState closest = null;
        var closestDistance = float.MaxValue;

        for (var i = 0; i < state.territories.Count; i++)
        {
            var territory = state.territories[i];
            if (territory == null)
            {
                continue;
            }

            var dx = territory.x - x;
            var dz = territory.z - z;
            var distance = Mathf.Sqrt(dx * dx + dz * dz);
            if (distance < closestDistance)
            {
                closestDistance = distance;
                closest = territory;
            }
        }

        return closest;
    }

    public static float GetControlStrength(GameState state, TerritoryState territory)
    {
        if (state == null || territory == null)
        {
            return 0f;
        }

        var owner = state.GetPlayer(territory.ownerPlayerId);
        if (owner == null)
        {
            return territory.claimStrength * territory.decayMultiplier;
        }

        var resources = state.GetResourcePool(owner.playerId);
        var resourceFactor = resources == null ? 1f : Mathf.Clamp01((resources.food + resources.wood + resources.stone + resources.iron) / 400f + 0.5f);
        return territory.claimStrength * territory.decayMultiplier * resourceFactor;
    }

    public static void AdvanceTerritoryDecay(GameState state, float decayPerDay)
    {
        if (state == null)
        {
            return;
        }

        for (var i = 0; i < state.territories.Count; i++)
        {
            var territory = state.territories[i];
            if (territory == null)
            {
                continue;
            }

            territory.decayMultiplier = Mathf.Clamp01(territory.decayMultiplier - decayPerDay);
        }
    }

    public static void ReinforceTerritory(TerritoryState territory, float reinforcement)
    {
        if (territory == null || reinforcement <= 0f)
        {
            return;
        }

        territory.claimStrength = Mathf.Clamp(territory.claimStrength + reinforcement, 0f, 10f);
        territory.decayMultiplier = Mathf.Clamp01(territory.decayMultiplier + reinforcement * 0.05f);
    }
}
