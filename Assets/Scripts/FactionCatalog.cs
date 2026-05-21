using System;

public static class FactionCatalog
{
    public static readonly FactionDefinition[] All =
    {
        new FactionDefinition(
            "frankish-kingdom",
            "Frankish Kingdom",
            "Heavy cavalry, castle engineering, and direct battlefield power.",
            "Best at disciplined shock action and siege work.",
            "Slower movement, high upkeep, and weaker response to mobile raiders.",
            cavalryModifier: 1.35f,
            logisticsModifier: 0.95f,
            defenseModifier: 1.20f,
            mobilityModifier: 0.90f,
            tradeModifier: 1.00f,
            siegeModifier: 1.25f,
            scoutingModifier: 0.95f,
            tollModifier: 0.95f
        ),
        new FactionDefinition(
            "mongol-khanate",
            "Mongol Khanate",
            "Mobility, interception, and raiding dominance.",
            "Best at rapid response and battlefield repositioning.",
            "Weaker at holding stone fortresses and prolonged sieges.",
            cavalryModifier: 1.35f,
            logisticsModifier: 1.05f,
            defenseModifier: 0.85f,
            mobilityModifier: 1.35f,
            tradeModifier: 0.95f,
            siegeModifier: 0.80f,
            scoutingModifier: 1.20f,
            tollModifier: 0.90f
        ),
        new FactionDefinition(
            "abbasid-caliphate",
            "Abbasid Caliphate",
            "Administration, logistics, and sustained regional power.",
            "Best at feeding large forces and managing long supply lines.",
            "Expensive to expand aggressively when trade is cut.",
            cavalryModifier: 0.95f,
            logisticsModifier: 1.40f,
            defenseModifier: 1.00f,
            mobilityModifier: 1.00f,
            tradeModifier: 1.25f,
            siegeModifier: 1.00f,
            scoutingModifier: 1.00f,
            tollModifier: 1.05f
        ),
        new FactionDefinition(
            "byzantine-empire",
            "Byzantine Empire",
            "Defense, intelligence, and resilient territorial control.",
            "Best at fortifying holdings and anticipating attacks.",
            "Smaller operational scale and higher cost per active force.",
            cavalryModifier: 1.00f,
            logisticsModifier: 1.05f,
            defenseModifier: 1.35f,
            mobilityModifier: 0.95f,
            tradeModifier: 1.00f,
            siegeModifier: 1.05f,
            scoutingModifier: 1.35f,
            tollModifier: 1.00f
        ),
        new FactionDefinition(
            "khazar-khaganate",
            "Khazar Khaganate",
            "Chokepoint control, flexible mixed forces, and toll power.",
            "Best at taxing movement and adapting to route politics.",
            "Weaker if trade bypasses their controlled corridors.",
            cavalryModifier: 1.00f,
            logisticsModifier: 1.05f,
            defenseModifier: 1.00f,
            mobilityModifier: 1.05f,
            tradeModifier: 1.20f,
            siegeModifier: 0.95f,
            scoutingModifier: 1.05f,
            tollModifier: 1.35f
        )
    };

    public static bool IsValid(string factionId)
    {
        return GetOrNull(factionId) != null;
    }

    public static string GetDefaultFactionId()
    {
        return All[0].Id;
    }

    public static FactionDefinition Get(string factionId)
    {
        var faction = GetOrNull(factionId);
        if (faction == null)
        {
            throw new ArgumentException($"Unknown faction id: {factionId}", nameof(factionId));
        }

        return faction;
    }

    public static FactionDefinition GetOrNull(string factionId)
    {
        if (string.IsNullOrWhiteSpace(factionId))
        {
            return null;
        }

        for (var i = 0; i < All.Length; i++)
        {
            if (string.Equals(All[i].Id, factionId, StringComparison.OrdinalIgnoreCase))
            {
                return All[i];
            }
        }

        return null;
    }
}

[Serializable]
public sealed class FactionDefinition
{
    public string Id;
    public string DisplayName;
    public string Summary;
    public string Strength;
    public string Weakness;
    public float CavalryModifier;
    public float LogisticsModifier;
    public float DefenseModifier;
    public float MobilityModifier;
    public float TradeModifier;
    public float SiegeModifier;
    public float ScoutingModifier;
    public float TollModifier;

    public FactionDefinition(
        string id,
        string displayName,
        string summary,
        string strength,
        string weakness,
        float cavalryModifier,
        float logisticsModifier,
        float defenseModifier,
        float mobilityModifier,
        float tradeModifier,
        float siegeModifier,
        float scoutingModifier,
        float tollModifier)
    {
        Id = id;
        DisplayName = displayName;
        Summary = summary;
        Strength = strength;
        Weakness = weakness;
        CavalryModifier = cavalryModifier;
        LogisticsModifier = logisticsModifier;
        DefenseModifier = defenseModifier;
        MobilityModifier = mobilityModifier;
        TradeModifier = tradeModifier;
        SiegeModifier = siegeModifier;
        ScoutingModifier = scoutingModifier;
        TollModifier = tollModifier;
    }
}
