# Lag Spike revision 8: no lateral head lag

Runtime: f598017d4684a5d018c7b90c30b4d6f1f5c4d03c8aca3c33c1bdcf260b6b1f7d
Source: 3b71a61e70a20f36f408ff0de5ff4cd9f04f36dee61c764d962516187212d023

Idle and move now keep the head centered laterally, with rearward delay, slight upward separation, held poses and forward catch-up. Lateral head translation and yaw are removed.

Guarded export passes. Direct checks on exported GLB head translation channels confirm x=0 throughout idle and move (head-motion.json). Both loop endpoints pass. Clearance audit samples 469 poses with no unexpected intersections in its recorded scope. Shared inspector captures 28 animation samples and fixed/phone/silhouette views. Head trajectories are an intentional visual lag effect, with stationary root. User art approval remains separate.
