using UnityEngine;

[CreateAssetMenu(menuName = "MedievalAR/Game Config", fileName = "GameConfig")]
public sealed class GameConfig : ScriptableObject
{
    [Header("Identity")]
    public string gameName = "MedievalAR";
    public string defaultPlayerName = "Player";
    public string defaultFactionId = "frankish-kingdom";
    public string defaultDynastyPrefix = "House";

    [Header("World")]
    [Min(1f)] public float secondsPerWorldDay = 180f;
    [Min(1f)] public float autoSaveIntervalSeconds = 30f;
    [Min(1f)] public float claimRadiusMeters = 120f;
    [Min(1f)] public float decayHalfLifeDays = 14f;

    [Header("Economy")]
    [Min(1)] public int startingFood = 100;
    [Min(1)] public int startingWood = 60;
    [Min(1)] public int startingStone = 25;
    [Min(1)] public int startingIron = 10;

    [Header("AI Enemies")]
    [Min(1)] public int startingEnemyHouses = 3;
    [Min(0.1f)] public float enemyHouseAggression = 0.65f;
    [Min(0.1f)] public float enemyHouseExpansionism = 0.55f;
    [Min(0.1f)] public float enemyActionIntervalDays = 1f;
    [Min(0.1f)] public float enemyStartingResourceMultiplier = 1f;
    [Min(0.1f)] public float enemyStartingArmyStrength = 1f;
    [Min(0.1f)] public float enemyStartingTerritoryStrength = 0.85f;
}
