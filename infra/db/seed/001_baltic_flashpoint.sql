-- Seed: Baltic Flashpoint scenario
-- Default scenario for the Greyzone simulation

INSERT INTO scenarios (id, name, description, config) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Baltic Flashpoint',
    'NATO and Russia compete across all 8 battlespace domains around the Baltic region. Blue Coalition seeks stability; Red Federation seeks strategic advantage through controlled escalation.',
    '{
        "max_turns": 50,
        "roles": [
            {
                "id": "blue_commander",
                "name": "Blue Coalition Commander",
                "description": "Commands NATO/Blue Coalition forces and alliance relations",
                "controlled_actors": ["blue_coalition", "neutral_states"]
            },
            {
                "id": "red_commander",
                "name": "Red Federation Commander",
                "description": "Commands Red Federation forces and proxy relations",
                "controlled_actors": ["red_federation", "separatist_movement"]
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
                "id": "00000000-0000-0000-0001-000000000001",
                "name": "Blue Coalition",
                "kind": "State",
                "capabilities": {
                    "Kinetic": 0.8,
                    "MaritimeLogistics": 0.7,
                    "Energy": 0.5,
                    "GeoeconomicIndustrial": 0.7,
                    "Cyber": 0.7,
                    "SpacePnt": 0.8,
                    "InformationCognitive": 0.6,
                    "DomesticPoliticalFiscal": 0.5
                },
                "resources": 100.0,
                "morale": 0.7,
                "visibility": "Public"
            },
            {
                "id": "00000000-0000-0000-0001-000000000002",
                "name": "Red Federation",
                "kind": "State",
                "capabilities": {
                    "Kinetic": 0.7,
                    "MaritimeLogistics": 0.5,
                    "Energy": 0.8,
                    "GeoeconomicIndustrial": 0.5,
                    "Cyber": 0.8,
                    "SpacePnt": 0.6,
                    "InformationCognitive": 0.8,
                    "DomesticPoliticalFiscal": 0.6
                },
                "resources": 80.0,
                "morale": 0.8,
                "visibility": "Public"
            },
            {
                "id": "00000000-0000-0000-0001-000000000003",
                "name": "Neutral States",
                "kind": "Alliance",
                "capabilities": {
                    "Kinetic": 0.3,
                    "MaritimeLogistics": 0.4,
                    "Energy": 0.6,
                    "GeoeconomicIndustrial": 0.5,
                    "Cyber": 0.4,
                    "SpacePnt": 0.2,
                    "InformationCognitive": 0.5,
                    "DomesticPoliticalFiscal": 0.7
                },
                "resources": 60.0,
                "morale": 0.6,
                "visibility": "Public"
            },
            {
                "id": "00000000-0000-0000-0001-000000000004",
                "name": "Separatist Movement",
                "kind": "ProxyNonState",
                "capabilities": {
                    "Kinetic": 0.3,
                    "MaritimeLogistics": 0.1,
                    "Energy": 0.1,
                    "GeoeconomicIndustrial": 0.1,
                    "Cyber": 0.4,
                    "SpacePnt": 0.0,
                    "InformationCognitive": 0.6,
                    "DomesticPoliticalFiscal": 0.3
                },
                "resources": 20.0,
                "morale": 0.9,
                "visibility": {"RoleScoped": ["red_commander"]}
            },
            {
                "id": "00000000-0000-0000-0001-000000000005",
                "name": "European Energy Grid",
                "kind": "InfrastructureOperator",
                "capabilities": {
                    "Kinetic": 0.0,
                    "MaritimeLogistics": 0.3,
                    "Energy": 0.9,
                    "GeoeconomicIndustrial": 0.6,
                    "Cyber": 0.5,
                    "SpacePnt": 0.1,
                    "InformationCognitive": 0.2,
                    "DomesticPoliticalFiscal": 0.4
                },
                "resources": 50.0,
                "morale": 0.5,
                "visibility": "Public"
            }
        ],
        "initial_layers": {
            "Kinetic":                  {"stress": 0.10, "resilience": 0.80, "friction": 0.20, "activity_level": 0.15, "variables": {"troop_readiness": 0.7, "weapons_stockpile": 0.8}},
            "MaritimeLogistics":        {"stress": 0.08, "resilience": 0.75, "friction": 0.15, "activity_level": 0.20, "variables": {"shipping_volume": 0.9, "port_capacity": 0.8}},
            "Energy":                   {"stress": 0.15, "resilience": 0.65, "friction": 0.25, "activity_level": 0.30, "variables": {"supply_security": 0.6, "price_stability": 0.5}},
            "GeoeconomicIndustrial":    {"stress": 0.12, "resilience": 0.70, "friction": 0.20, "activity_level": 0.25, "variables": {"trade_flow": 0.7, "supply_chain_integrity": 0.7}},
            "Cyber":                    {"stress": 0.20, "resilience": 0.60, "friction": 0.30, "activity_level": 0.35, "variables": {"network_integrity": 0.7, "incident_rate": 0.3}},
            "SpacePnt":                 {"stress": 0.05, "resilience": 0.85, "friction": 0.10, "activity_level": 0.10, "variables": {"satellite_health": 0.9, "gps_accuracy": 0.95}},
            "InformationCognitive":     {"stress": 0.18, "resilience": 0.55, "friction": 0.35, "activity_level": 0.40, "variables": {"narrative_control": 0.5, "public_trust": 0.5}},
            "DomesticPoliticalFiscal":  {"stress": 0.14, "resilience": 0.60, "friction": 0.30, "activity_level": 0.25, "variables": {"fiscal_headroom": 0.6, "political_cohesion": 0.5}}
        },
        "stochastic_events": [
            {"name": "Cyber Intrusion Detected", "description": "A significant cyber intrusion is detected in critical infrastructure", "affected_layer": "Cyber", "stress_delta": 0.08, "resilience_delta": -0.03, "probability": 0.12, "visibility": "Public"},
            {"name": "Energy Supply Disruption", "description": "A major energy supply route is disrupted", "affected_layer": "Energy", "stress_delta": 0.10, "resilience_delta": -0.05, "probability": 0.08, "visibility": "Public"},
            {"name": "Political Crisis", "description": "Domestic political crisis erupts in a key state", "affected_layer": "DomesticPoliticalFiscal", "stress_delta": 0.07, "resilience_delta": -0.04, "probability": 0.10, "visibility": "Public"},
            {"name": "Naval Incident", "description": "Unplanned naval confrontation in contested waters", "affected_layer": "MaritimeLogistics", "stress_delta": 0.12, "resilience_delta": -0.02, "probability": 0.06, "visibility": "Public"},
            {"name": "Disinformation Campaign", "description": "Coordinated disinformation campaign detected", "affected_layer": "InformationCognitive", "stress_delta": 0.09, "resilience_delta": -0.06, "probability": 0.15, "visibility": "Public"},
            {"name": "Satellite Anomaly", "description": "Unexpected anomaly detected in positioning satellites", "affected_layer": "SpacePnt", "stress_delta": 0.06, "resilience_delta": -0.02, "probability": 0.04, "visibility": "Public"},
            {"name": "Trade Sanctions Leak", "description": "Intelligence about planned trade sanctions leaks", "affected_layer": "GeoeconomicIndustrial", "stress_delta": 0.05, "resilience_delta": -0.02, "probability": 0.10, "visibility": "Public"},
            {"name": "Military Exercise Escalation", "description": "Scheduled military exercise perceived as threatening", "affected_layer": "Kinetic", "stress_delta": 0.07, "resilience_delta": 0.0, "probability": 0.08, "visibility": "Public"},
            {"name": "Alliance Solidarity Statement", "description": "Key alliance issues strong solidarity statement", "affected_layer": "DomesticPoliticalFiscal", "stress_delta": -0.05, "resilience_delta": 0.03, "probability": 0.10, "visibility": "Public"},
            {"name": "Cyber Defense Breakthrough", "description": "Significant improvement in cyber defense capability", "affected_layer": "Cyber", "stress_delta": -0.04, "resilience_delta": 0.05, "probability": 0.06, "visibility": {"RoleScoped": ["blue_commander"]}},
            {"name": "Energy Deal Signed", "description": "New energy supply agreement reached", "affected_layer": "Energy", "stress_delta": -0.06, "resilience_delta": 0.04, "probability": 0.07, "visibility": "Public"},
            {"name": "Proxy Provocation", "description": "Non-state proxy actor conducts provocative action", "affected_layer": "Kinetic", "stress_delta": 0.06, "resilience_delta": -0.01, "probability": 0.09, "visibility": "Public"},
            {"name": "Economic Confidence Boost", "description": "Positive economic indicators bolster confidence", "affected_layer": "GeoeconomicIndustrial", "stress_delta": -0.04, "resilience_delta": 0.03, "probability": 0.08, "visibility": "Public"},
            {"name": "Intelligence Leak", "description": "Classified intelligence is leaked to media", "affected_layer": "InformationCognitive", "stress_delta": 0.05, "resilience_delta": -0.04, "probability": 0.07, "visibility": "Public"},
            {"name": "Infrastructure Hardening", "description": "Critical infrastructure protection measures completed", "affected_layer": "Energy", "stress_delta": -0.03, "resilience_delta": 0.06, "probability": 0.05, "visibility": {"RoleScoped": ["blue_commander"]}}
        ]
    }'
) ON CONFLICT (name) DO NOTHING;

-- Create a default AI user
INSERT INTO users (id, username, display_name, email, password_hash, is_active, is_ai) VALUES (
    '00000000-0000-0000-0002-000000000001',
    'ai_opponent',
    'AI Opponent',
    NULL,
    '$2b$12$F62N8w7f5PV/BHfQfbQW4.SWb4wKzR6B4V6i.B3v8vW6R9k1Jf9Q6',
    TRUE,
    TRUE
) ON CONFLICT (username) DO NOTHING;
