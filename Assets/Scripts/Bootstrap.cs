using UnityEngine;

public sealed class Bootstrap : MonoBehaviour
{
    private static Bootstrap instance;

    [SerializeField] private GameConfig config;

    private GameSession session;

    public GameSession Session => session;

    public void Initialize(GameConfig injectedConfig)
    {
        config = injectedConfig;
    }

    private void Awake()
    {
        if (instance != null && instance != this)
        {
            Destroy(gameObject);
            return;
        }

        instance = this;
        DontDestroyOnLoad(gameObject);

        if (config == null)
        {
            config = ScriptableObject.CreateInstance<GameConfig>();
        }

        session = GameSession.Create(config);
        var localPlayer = session.LocalPlayer;
        var faction = FactionCatalog.Get(localPlayer.factionId);

        Debug.Log($"{config.gameName} booted. Player '{localPlayer.displayName}' is aligned to {faction.DisplayName}. World days: {session.State.meta.totalGameDays:F2}. Routes: {session.State.routeSegments.Count}. Territories: {session.State.territories.Count}");
    }

    private void Update()
    {
        session?.Advance(Time.deltaTime);
    }

    private void OnApplicationPause(bool pause)
    {
        if (pause)
        {
            session?.Save();
        }
    }

    private void OnApplicationQuit()
    {
        session?.Save();
    }

    private void OnDestroy()
    {
        if (instance == this)
        {
            instance = null;
        }
    }
}
