using System;
using UnityEngine;

public enum AnimalType
{
    Cattle,
    Sheep,
    Goats,
    Pigs,
    Horses,
    Chickens
}

[Serializable]
public sealed class PopulationState
{
    public string populationId;
    public string ownerPlayerId;
    public string settlementId;
    public int villagers;
    public int laborers;
    public int soldiers;
    public int artisans;
    public int traders;
    public float loyalty = 0.75f;
    public float health = 0.75f;
}

[Serializable]
public sealed class LivestockHerdState
{
    public string herdId;
    public string ownerPlayerId;
    public string settlementId;
    public AnimalType animalType;
    public int count;
    public float fertility = 0.75f;
    public float health = 0.75f;
}

public static class PopulationSystem
{
    public static PopulationState CreateStarterPopulation(string ownerPlayerId, string settlementId)
    {
        return new PopulationState
        {
            populationId = GenerateShortId("pop-"),
            ownerPlayerId = ownerPlayerId,
            settlementId = settlementId,
            villagers = 25,
            laborers = 12,
            soldiers = 8,
            artisans = 3,
            traders = 2,
            loyalty = 0.75f,
            health = 0.8f
        };
    }

    public static LivestockHerdState CreateStarterHerd(string ownerPlayerId, string settlementId, AnimalType type, int count)
    {
        return new LivestockHerdState
        {
            herdId = GenerateShortId("herd-"),
            ownerPlayerId = ownerPlayerId,
            settlementId = settlementId,
            animalType = type,
            count = Mathf.Max(1, count),
            fertility = 0.75f,
            health = 0.8f
        };
    }

    public static int GetLaborOutput(PopulationState population)
    {
        if (population == null)
        {
            return 0;
        }

        var baseOutput = population.laborers + population.artisans * 2 + population.traders;
        return Mathf.RoundToInt(baseOutput * Mathf.Clamp01(population.health) * Mathf.Clamp01(population.loyalty));
    }

    public static void AdvancePopulation(PopulationState population, float deltaTime)
    {
        if (population == null || deltaTime <= 0f)
        {
            return;
        }

        population.health = Mathf.Clamp01(population.health - deltaTime * 0.0002f);
        population.loyalty = Mathf.Clamp01(population.loyalty - deltaTime * 0.0001f);
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
