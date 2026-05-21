using UnityEngine;

public sealed class BootstrapSceneInstaller : MonoBehaviour
{
    [SerializeField] private GameConfig config;

    private void Start()
    {
        if (FindFirstObjectByType<Bootstrap>() == null)
        {
            var root = new GameObject("Bootstrap");
            var bootstrap = root.AddComponent<Bootstrap>();

            if (config != null)
            {
                bootstrap.Initialize(config);
            }
        }
    }
}
