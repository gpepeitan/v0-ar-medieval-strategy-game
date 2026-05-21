using System;
using UnityEngine;

public enum StructureType
{
    Farm,
    Village,
    Town,
    City,
    Mine,
    Workshop,
    Market,
    Outpost,
    Fort,
    Castle,
    Road,
    Bridge,
    Gate,
    Tower,
    Palisade,
    Watchpoint,
    TollPost,
    SiegeWork
}

[Serializable]
public sealed class StructureState
{
    public string structureId;
    public string ownerPlayerId;
    public string territoryId;
    public StructureType structureType;
    public string name;
    public int level = 1;
    public float integrity = 1f;
    public float garrisonBonus;
    public float productionBonus;
    public float tollBonus;
    public bool isOperational = true;
}

public static class SettlementSystem
{
    public static StructureState CreateStructure(string ownerPlayerId, string territoryId, StructureType type, string name)
    {
        return new StructureState
        {
            structureId = GenerateShortId("str-"),
            ownerPlayerId = ownerPlayerId,
            territoryId = territoryId,
            structureType = type,
            name = name,
            level = 1,
            integrity = 1f,
            garrisonBonus = GetDefaultGarrisonBonus(type),
            productionBonus = GetDefaultProductionBonus(type),
            tollBonus = GetDefaultTollBonus(type),
            isOperational = true
        };
    }

    public static void ApplyDecay(StructureState structure, float decayRate)
    {
        if (structure == null || decayRate <= 0f)
        {
            return;
        }

        structure.integrity = Mathf.Clamp01(structure.integrity - decayRate);
        structure.isOperational = structure.integrity > 0.2f;
    }

    private static float GetDefaultGarrisonBonus(StructureType type)
    {
        switch (type)
        {
            case StructureType.Fort:
            case StructureType.Castle:
            case StructureType.Tower:
            case StructureType.Gate:
            case StructureType.Palisade:
                return 1f;
            default:
                return 0f;
        }
    }

    private static float GetDefaultProductionBonus(StructureType type)
    {
        switch (type)
        {
            case StructureType.Farm:
            case StructureType.Mine:
            case StructureType.Workshop:
            case StructureType.Market:
            case StructureType.Village:
            case StructureType.Town:
            case StructureType.City:
                return 0.5f;
            default:
                return 0f;
        }
    }

    private static float GetDefaultTollBonus(StructureType type)
    {
        return type == StructureType.TollPost ? 1f : 0f;
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
