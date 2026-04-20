-- Seed: Strait of Hormuz Flashpoint scenario
-- High-difficulty scenario: US 5th Fleet / GCC vs IRGC in the Persian Gulf

INSERT INTO scenarios (id, name, description, config) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Strait of Hormuz Flashpoint',
    'The world''s most critical maritime chokepoint is at the breaking point. Twenty percent of global oil transits the 35km-wide Strait of Hormuz. Following tanker seizures, drone strikes, and covert mine-laying operations, US CENTCOM and the IRGC stand at the edge of open conflict. The GCC coalition is fractured. China watches from the wings. Every move echoes across global energy markets.',
    '{
        "scenario_id": "hormuz-flashpoint-v1",
        "max_turns": 40,
        "author": "Greyzone Design Team",
        "roles": [
            {
                "id": "blue_commander",
                "name": "Blue Commander",
                "description": "Commands US 5th Fleet and GCC Coalition forces across the Persian Gulf",
                "controlled_actors": ["us_5th_fleet_gcc", "gulf_tanker_fleet"]
            },
            {
                "id": "red_commander",
                "name": "Red Commander",
                "description": "Commands IRGC naval forces and proxy networks including the Houthi Movement",
                "controlled_actors": ["irgc_iran", "houthi_movement"]
            },
            {
                "id": "observer",
                "name": "Observer",
                "description": "Read-only observer with public visibility",
                "controlled_actors": []
            }
        ],
        "actors": [
            {
                "id": "us_5th_fleet_gcc",
                "name": "US 5th Fleet / GCC Coalition",
                "kind": "State",
                "capabilities": {
                    "Kinetic": 0.85,
                    "MaritimeLogistics": 0.90,
                    "Energy": 0.30,
                    "GeoeconomicIndustrial": 0.55,
                    "Cyber": 0.75,
                    "SpacePnt": 0.85,
                    "InformationCognitive": 0.55,
                    "DomesticPoliticalFiscal": 0.60
                },
                "resources": 85.0,
                "morale": 0.75,
                "visibility": "Public"
            },
            {
                "id": "irgc_iran",
                "name": "IRGC / Islamic Republic of Iran",
                "kind": "State",
                "capabilities": {
                    "Kinetic": 0.70,
                    "MaritimeLogistics": 0.75,
                    "Energy": 0.85,
                    "GeoeconomicIndustrial": 0.65,
                    "Cyber": 0.80,
                    "SpacePnt": 0.35,
                    "InformationCognitive": 0.75,
                    "DomesticPoliticalFiscal": 0.70
                },
                "resources": 100.0,
                "morale": 0.70,
                "visibility": "Public"
            },
            {
                "id": "houthi_movement",
                "name": "Houthi Movement",
                "kind": "NonStateActor",
                "capabilities": {
                    "Kinetic": 0.60,
                    "MaritimeLogistics": 0.55,
                    "Energy": 0.20,
                    "GeoeconomicIndustrial": 0.15,
                    "Cyber": 0.30,
                    "SpacePnt": 0.10,
                    "InformationCognitive": 0.70,
                    "DomesticPoliticalFiscal": 0.20
                },
                "resources": 30.0,
                "morale": 0.80,
                "visibility": "RedOnly"
            },
            {
                "id": "gulf_tanker_fleet",
                "name": "Gulf Tanker Fleet / Neutral Shipping",
                "kind": "NonStateActor",
                "capabilities": {
                    "Kinetic": 0.10,
                    "MaritimeLogistics": 0.80,
                    "Energy": 0.65,
                    "GeoeconomicIndustrial": 0.70,
                    "Cyber": 0.25,
                    "SpacePnt": 0.30,
                    "InformationCognitive": 0.25,
                    "DomesticPoliticalFiscal": 0.20
                },
                "resources": 50.0,
                "morale": 0.60,
                "visibility": "Public"
            },
            {
                "id": "gulf_energy_infra",
                "name": "Gulf Energy Infrastructure",
                "kind": "Infrastructure",
                "capabilities": {
                    "Kinetic": 0.05,
                    "MaritimeLogistics": 0.40,
                    "Energy": 0.90,
                    "GeoeconomicIndustrial": 0.80,
                    "Cyber": 0.30,
                    "SpacePnt": 0.15,
                    "InformationCognitive": 0.20,
                    "DomesticPoliticalFiscal": 0.55
                },
                "resources": 60.0,
                "morale": 0.65,
                "visibility": "Public"
            }
        ],
        "initial_layers": {
            "Kinetic":                  {"stress": 0.15, "resilience": 0.78, "friction": 0.25, "activity_level": 0.30, "variables": {"force_posture": 0.30, "readiness": 0.72, "theater_control": 0.45}},
            "MaritimeLogistics":        {"stress": 0.25, "resilience": 0.68, "friction": 0.35, "activity_level": 0.45, "variables": {"sloc_throughput": 0.62, "naval_presence": 0.50, "mine_density": 0.25, "strait_transit_rate": 0.70}},
            "Energy":                   {"stress": 0.28, "resilience": 0.68, "friction": 0.30, "activity_level": 0.50, "variables": {"production_level": 0.75, "price_index": 1.45, "infrastructure_integrity": 0.68, "oil_export_rate": 0.72}},
            "GeoeconomicIndustrial":    {"stress": 0.20, "resilience": 0.72, "friction": 0.25, "activity_level": 0.35, "variables": {"trade_flow": 0.68, "sanctions_pressure": 0.32, "industrial_output": 0.72, "oil_market_stability": 0.55}},
            "Cyber":                    {"stress": 0.12, "resilience": 0.75, "friction": 0.20, "activity_level": 0.28, "variables": {"cyber_posture": 0.62, "vulnerability_index": 0.35, "attack_capacity": 0.70}},
            "SpacePnt":                 {"stress": 0.08, "resilience": 0.82, "friction": 0.15, "activity_level": 0.22, "variables": {"satellite_health": 0.82, "pnt_accuracy": 0.88, "asat_readiness": 0.25}},
            "InformationCognitive":     {"stress": 0.18, "resilience": 0.70, "friction": 0.28, "activity_level": 0.38, "variables": {"narrative_control": 0.45, "public_opinion": 0.52, "disinformation_intensity": 0.42}},
            "DomesticPoliticalFiscal":  {"stress": 0.14, "resilience": 0.76, "friction": 0.20, "activity_level": 0.25, "variables": {"gov_stability": 0.70, "fiscal_reserves": 0.75, "political_will": 0.65, "alliance_cohesion": 0.55}}
        },
        "stochastic_events": [
            {"name": "IRGC Fast Boat Swarm",             "description": "A swarm of IRGC fast attack craft conducts a high-speed intercept of a US naval vessel in international waters.",          "affected_layer": "Kinetic",                "stress_delta": 0.04,  "resilience_delta": -0.01, "probability": 0.10, "visibility": "Public"},
            {"name": "Tanker Seizure in Strait",         "description": "IRGC commandos rappel onto a flagged tanker in the Strait, triggering an international maritime incident.",                  "affected_layer": "MaritimeLogistics",      "stress_delta": 0.06,  "resilience_delta": -0.02, "probability": 0.08, "visibility": "Public"},
            {"name": "Drone Strike on Aramco Facility",  "description": "Iranian-linked drones strike a Saudi Aramco processing facility, briefly cutting 5% of global oil supply.",                  "affected_layer": "Energy",                 "stress_delta": 0.07,  "resilience_delta": -0.02, "probability": 0.07, "visibility": "Public"},
            {"name": "US Carrier Strike Group Arrival",  "description": "A US carrier strike group transits the Strait of Hormuz and takes up position in the Gulf of Oman.",                         "affected_layer": "Kinetic",                "stress_delta": 0.03,  "resilience_delta":  0.04, "probability": 0.10, "visibility": "Public"},
            {"name": "Houthi Ballistic Missile Launch",  "description": "Houthi forces launch a barrage of ballistic missiles at GCC military installations in Saudi Arabia and the UAE.",             "affected_layer": "Kinetic",                "stress_delta": 0.05,  "resilience_delta": -0.02, "probability": 0.09, "visibility": "Public"},
            {"name": "Oil Price Shock",                  "description": "Strait tensions trigger a 25% oil price spike, destabilising global financial markets and straining defence budgets.",         "affected_layer": "GeoeconomicIndustrial",  "stress_delta": 0.05,  "resilience_delta": -0.02, "probability": 0.11, "visibility": "Public"},
            {"name": "Iranian Mine Deployment",          "description": "Intelligence confirms IRGC mine-laying vessels have seeded portions of the strait with contact mines overnight.",              "affected_layer": "MaritimeLogistics",      "stress_delta": 0.05,  "resilience_delta": -0.02, "probability": 0.08, "visibility": "Public"},
            {"name": "Strait GPS Jamming",               "description": "Sophisticated GPS jamming blankets the strait, forcing tankers onto manual navigation and disrupting US precision weapons.",   "affected_layer": "SpacePnt",               "stress_delta": 0.04,  "resilience_delta": -0.02, "probability": 0.08, "visibility": "Public"},
            {"name": "Gulf Disinformation Surge",        "description": "A coordinated disinformation campaign floods regional media with fabricated footage of US aggression in the Gulf.",            "affected_layer": "InformationCognitive",   "stress_delta": 0.04,  "resilience_delta": -0.01, "probability": 0.10, "visibility": "Public"},
            {"name": "GCC Emergency Summit",             "description": "Gulf leaders convene an emergency summit, producing a joint communiqué that strengthens coalition solidarity.",                 "affected_layer": "DomesticPoliticalFiscal","stress_delta": -0.06, "resilience_delta":  0.05, "probability": 0.14, "visibility": "Public"},
            {"name": "China Diplomatic Intervention",    "description": "China''s foreign minister conducts shuttle diplomacy between Tehran and Riyadh, proposing a de-escalation framework.",         "affected_layer": "GeoeconomicIndustrial",  "stress_delta": -0.07, "resilience_delta":  0.04, "probability": 0.13, "visibility": "Public"},
            {"name": "Cyberattack on Abqaiq Facility",   "description": "A sophisticated cyberattack penetrates industrial control systems at the Abqaiq oil processing complex.",                     "affected_layer": "Cyber",                  "stress_delta": 0.06,  "resilience_delta": -0.02, "probability": 0.07, "visibility": "Public"},
            {"name": "US Sanctions Escalation",          "description": "Washington announces sweeping new sanctions targeting Iranian oil exports, banking, and IRGC commanders.",                     "affected_layer": "GeoeconomicIndustrial",  "stress_delta": 0.05,  "resilience_delta": -0.01, "probability": 0.09, "visibility": "Public"},
            {"name": "IRGC Submarine Activity",          "description": "A US P-8 Poseidon locates an IRGC submarine conducting close surveillance of the carrier strike group.",                      "affected_layer": "MaritimeLogistics",      "stress_delta": 0.04,  "resilience_delta": -0.01, "probability": 0.08, "visibility": "Public"},
            {"name": "Houthi Sea Mine Strike",           "description": "A commercial tanker strikes a Houthi-laid sea mine in the Red Sea, flooding the engine room.",                                "affected_layer": "MaritimeLogistics",      "stress_delta": 0.06,  "resilience_delta": -0.02, "probability": 0.09, "visibility": "Public"},
            {"name": "Iranian Nuclear Signal",           "description": "Iran announces enrichment to 90% purity at Fordow, crossing a red line that triggers international alarm.",                    "affected_layer": "DomesticPoliticalFiscal","stress_delta": 0.05,  "resilience_delta": -0.02, "probability": 0.07, "visibility": "Public"},
            {"name": "Red Sea Shipping Diversion",       "description": "Major shipping companies divert vessels away from the Red Sea and Hormuz, adding weeks to global transit times.",              "affected_layer": "GeoeconomicIndustrial",  "stress_delta": 0.04,  "resilience_delta": -0.01, "probability": 0.10, "visibility": "Public"},
            {"name": "US Embassy Evacuation",            "description": "Washington orders non-essential staff evacuated from Gulf embassies as the threat level reaches CRITICAL.",                    "affected_layer": "DomesticPoliticalFiscal","stress_delta": 0.04,  "resilience_delta": -0.01, "probability": 0.07, "visibility": "Public"},
            {"name": "GCC Air Defense Alert",            "description": "GCC air defence systems go to maximum alert following detection of multiple approaching ballistic missile trajectories.",        "affected_layer": "Kinetic",                "stress_delta": 0.03,  "resilience_delta":  0.03, "probability": 0.10, "visibility": "Public"},
            {"name": "Oil Tanker Insurance Collapse",    "description": "Lloyd''s of London withdraws coverage for Gulf-transiting tankers, effectively halting commercial shipping through the strait.", "affected_layer": "GeoeconomicIndustrial",  "stress_delta": 0.05,  "resilience_delta": -0.02, "probability": 0.10, "visibility": "Public"},
            {"name": "Oman Back-Channel Talks",          "description": "Oman hosts secret back-channel talks between US and Iranian officials, creating a viable diplomatic path.",                    "affected_layer": "InformationCognitive",   "stress_delta": -0.06, "resilience_delta":  0.04, "probability": 0.12, "visibility": "Public"},
            {"name": "UN Security Council Resolution",   "description": "The UN Security Council passes a unanimous resolution calling for restraint in the Gulf.",                                     "affected_layer": "DomesticPoliticalFiscal","stress_delta": -0.05, "resilience_delta":  0.05, "probability": 0.11, "visibility": "Public"},
            {"name": "Gulf Maritime De-confliction",     "description": "Naval commanders establish a maritime de-confliction hotline to prevent accidental engagements.",                               "affected_layer": "MaritimeLogistics",      "stress_delta": -0.05, "resilience_delta":  0.06, "probability": 0.10, "visibility": "Public"},
            {"name": "Iranian Moderates Gain Ground",    "description": "Iranian reformist factions push for de-escalation, citing economic damage from sanctions.",                                    "affected_layer": "GeoeconomicIndustrial",  "stress_delta": -0.06, "resilience_delta":  0.03, "probability": 0.10, "visibility": "Public"},
            {"name": "Energy Market Stabilisation Fund", "description": "IEA members release strategic petroleum reserves, dampening the oil price shock.",                                             "affected_layer": "Energy",                 "stress_delta": -0.05, "resilience_delta":  0.04, "probability": 0.11, "visibility": "Public"},
            {"name": "Cyber Ceasefire Signal",           "description": "Both sides quietly halt offensive cyber operations following back-channel communications.",                                     "affected_layer": "Cyber",                  "stress_delta": -0.05, "resilience_delta":  0.05, "probability": 0.09, "visibility": "Public"}
        ]
    }'
) ON CONFLICT (name) DO NOTHING;
