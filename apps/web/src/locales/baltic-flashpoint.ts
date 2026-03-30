import type { ScenarioLocale } from "../types/scenario-locale";

export const balticFlashpointLocale: ScenarioLocale = {
  scenario_id: "baltic-flashpoint-v1",
  display_name: "Baltic Flashpoint",
  theatre: "Baltic Region",
  setting_description:
    "Tensions in the Baltic theatre have reached a critical inflection point. NATO's eastern flank is under sustained hybrid pressure as Russian forces mass near Kaliningrad and the Baltic border. The alliance faces a defining test of Article 5 credibility while managing cascading energy, cyber, and information threats.",

  blue_faction_name: "NATO Baltic Coalition",
  red_faction_name: "Russian Baltic Forces",

  actor_names: {
    blue_coalition: "NATO Baltic Coalition",
    red_federation: "Russian Baltic Forces",
    neutral_states: "Nordic & Baltic States",
    separatist_movement: "Baltic Separatist Militia",
    european_energy_grid: "European Energy Infrastructure",
  },

  actor_flags: {
    blue_coalition: "🇺🇸🇬🇧🇩🇪🇵🇱",
    red_federation: "🇷🇺",
    neutral_states: "🇫🇮🇸🇪🇪🇪🇱🇻🇱🇹",
    separatist_movement: "⚑",
    european_energy_grid: "🇪🇺",
  },

  domains: {
    Kinetic: {
      label: "Land & Air Forces",
      description:
        "NATO and Russian ground forces manoeuvre along the eastern flank, with air power contesting Baltic airspace.",
    },
    MaritimeLogistics: {
      label: "Baltic Sea Lanes",
      description:
        "The enclosed Baltic Sea is critical for Nordic energy imports and NATO resupply — Russian naval assets threaten SLOC integrity.",
    },
    Energy: {
      label: "European Energy Grid",
      description:
        "European dependence on pipeline gas and LNG creates acute leverage points for economic coercion.",
    },
    GeoeconomicIndustrial: {
      label: "European Economy",
      description:
        "Sanctions, trade disruption, and industrial capacity determine the financial staying power of each bloc.",
    },
    Cyber: {
      label: "Cyberspace Operations",
      description:
        "Both sides contest critical infrastructure, command networks, and public information systems through persistent cyber operations.",
    },
    SpacePnt: {
      label: "Space & Navigation",
      description:
        "GPS precision, satellite reconnaissance, and space domain awareness underpin modern Baltic warfighting.",
    },
    InformationCognitive: {
      label: "Information Environment",
      description:
        "Narrative control over Baltic populations, alliance cohesion, and Western public opinion shapes political will.",
    },
    DomesticPoliticalFiscal: {
      label: "Alliance Politics & Finance",
      description:
        "NATO unity, Article 5 credibility, and the fiscal capacity to sustain operations are the ultimate constraints.",
    },
  },

  action_locales: {
    blue_coalition: {
      Escalate: {
        label: "Heighten NATO Readiness",
        flavour:
          "Raise alert levels across the Eastern Flank, signalling resolve to adversaries and reassuring allies.",
      },
      DeEscalate: {
        label: "Diplomatic Stand-Down",
        flavour:
          "Reduce forward deployments and open backchannel communications to reduce tension.",
      },
      Reinforce: {
        label: "Bolster Alliance Resilience",
        flavour:
          "Strengthen the targeted domain against further shocks through investment and hardening.",
      },
      Disrupt: {
        label: "Degrade Russian Capacity",
        flavour:
          "Conduct operations to undermine adversary resilience in the targeted domain.",
      },
      Mobilize: {
        label: "Mobilise NATO Assets",
        flavour:
          "Activate reserve forces and prepositioning logistics to increase operational tempo.",
      },
      Negotiate: {
        label: "Engage Diplomatic Channels",
        flavour:
          "Pursue bilateral or multilateral talks to reduce friction and seek de-escalatory agreements.",
      },
      CyberAttack: {
        label: "NATO Cyber Command Operation",
        flavour:
          "Execute an offensive cyber operation against Russian military or critical infrastructure targets.",
      },
      InformationOp: {
        label: "Strategic Communications Campaign",
        flavour:
          "Deploy NATO's information apparatus to shape the narrative in Baltic states and Western publics.",
      },
      SanctionImpose: {
        label: "EU Sanctions Package",
        flavour:
          "Coordinate a new wave of economic sanctions targeting Russian financial institutions and energy exports.",
      },
      SanctionRelief: {
        label: "Partial Sanctions Relief",
        flavour:
          "Ease selected sanctions as a confidence-building measure or in response to Russian concessions.",
      },
      MilitaryDeploy: {
        label: "Deploy Battlegroup",
        flavour:
          "Move a multinational NATO battlegroup into forward positions along the Baltic states.",
      },
      NavalBlockade: {
        label: "Baltic Maritime Interdiction",
        flavour:
          "Establish a NATO naval cordon to interdict Russian resupply to Kaliningrad.",
      },
      SpaceAssetDeploy: {
        label: "Enhanced ISR Constellation",
        flavour:
          "Task additional reconnaissance and communications satellites to provide persistent Baltic coverage.",
      },
      DomesticPolicyShift: {
        label: "Alliance Solidarity Measure",
        flavour:
          "Push through domestic policy to reinforce Article 5 commitment and defence spending.",
      },
    },

    red_federation: {
      Escalate: {
        label: "Force Posture Escalation",
        flavour:
          "Increase Russian military activity in Kaliningrad and along the border to signal capability and resolve.",
      },
      DeEscalate: {
        label: "Diplomatic Signal",
        flavour:
          "Reduce visible military activity and convey willingness to negotiate, seeking to fracture NATO unity.",
      },
      Reinforce: {
        label: "Fortify Russian Position",
        flavour:
          "Harden military and civilian infrastructure against NATO pressure in the targeted domain.",
      },
      Disrupt: {
        label: "Undermine NATO Cohesion",
        flavour:
          "Target alliance weak points to fracture coordination and reduce collective response capacity.",
      },
      Mobilize: {
        label: "Mobilise Russian Forces",
        flavour:
          "Activate additional units and logistics for sustained operations, including partial reserve call-up.",
      },
      Negotiate: {
        label: "Moscow Diplomatic Overture",
        flavour:
          "Signal openness to talks — potentially to buy time, split allies, or extract concessions.",
      },
      CyberAttack: {
        label: "GRU Cyber Operation",
        flavour:
          "Deploy FSB/GRU cyber units against NATO command, Baltic infrastructure, or Western financial systems.",
      },
      InformationOp: {
        label: "Disinformation Campaign",
        flavour:
          "Amplify pro-Russian narratives, sow discord in Baltic populations, and undermine NATO legitimacy.",
      },
      SanctionImpose: {
        label: "Energy Supply Coercion",
        flavour:
          "Restrict gas or oil exports to leverage European energy dependence as a coercive instrument.",
      },
      SanctionRelief: {
        label: "Energy Supply Resumption",
        flavour:
          "Restore energy flows as a diplomatic signal or economic inducement for European neutrality.",
      },
      MilitaryDeploy: {
        label: "Baltic Fleet Surge",
        flavour:
          "Deploy additional Russian naval and air assets into the Baltic operational theatre.",
      },
      NavalBlockade: {
        label: "Baltic SLOC Interdiction",
        flavour:
          "Position Russian submarines and surface combatants to threaten NATO maritime supply lines.",
      },
      SpaceAssetDeploy: {
        label: "GLONASS & Recon Upgrade",
        flavour:
          "Enhance Russian space-based navigation and reconnaissance coverage over the Baltic theatre.",
      },
      DomesticPolicyShift: {
        label: "Kremlin Domestic Consolidation",
        flavour:
          "Shift domestic policy to increase war tolerance, restrict dissent, and mobilise industrial capacity.",
      },
    },
  },

  stochastic_events: {
    "Cyber Intrusion Detected": {
      label: "Critical Infrastructure Breach",
      flavour:
        "A significant intrusion is detected in NATO/Baltic critical infrastructure — origin assessed as GRU Unit 74455.",
    },
    "Energy Supply Disruption": {
      label: "Nord Stream Pressure Drop",
      flavour:
        "Unexplained pressure loss in Baltic undersea pipelines disrupts European gas supply.",
    },
    "Political Crisis": {
      label: "NATO Alliance Fracture",
      flavour:
        "A NATO member government signals reluctance to invoke Article 5, straining alliance solidarity.",
    },
    "Naval Incident": {
      label: "Baltic Sea Collision",
      flavour:
        "A Russian naval vessel conducts a dangerous intercept of a NATO warship in international waters.",
    },
    "Disinformation Surge": {
      label: "Coordinated Narrative Operation",
      flavour:
        "A sophisticated disinformation campaign floods Baltic social media, targeting ethnic Russian minorities.",
    },
    "Economic Shock": {
      label: "European Market Volatility",
      flavour:
        "Energy price spikes trigger financial market turbulence across the EU, straining defence budgets.",
    },
    "Military Exercise": {
      label: "Snap Exercise ZAPAD",
      flavour:
        "Russia announces a large-scale snap exercise near the Baltic border, masking potential offensive preparation.",
    },
    "Diplomatic Breakthrough": {
      label: "Backchannel Progress",
      flavour:
        "Quiet diplomacy yields a preliminary framework for de-escalation talks, creating a brief opening.",
    },
    "Proxy Activity": {
      label: "Militia Mobilisation",
      flavour:
        "Armed separatist militias in Baltic urban centres conduct coordinated provocations, straining local security forces.",
    },
    "Space Incident": {
      label: "Satellite Jamming Event",
      flavour:
        "GPS jamming over Baltic airspace disrupts commercial aviation and degrades NATO precision navigation.",
    },
    "Humanitarian Crisis": {
      label: "Refugee Flow Pressure",
      flavour:
        "Engineered refugee flows across the Belarusian border strain Baltic state resources and political capacity.",
    },
    "Alliance Reinforcement": {
      label: "NATO eFP Surge",
      flavour:
        "NATO enhanced Forward Presence battlegroups receive additional reinforcements, improving Eastern Flank deterrence.",
    },
    "Sanctions Escalation": {
      label: "Coordinated Sanctions Tranche",
      flavour:
        "The G7 announces a new sanctions package targeting Russian sovereign debt and energy exports.",
    },
    "Kinetic Incident": {
      label: "Border Incursion",
      flavour:
        "Russian Spetsnaz units conduct a brief, deniable incursion across the Finnish border, probing NATO response times.",
    },
    "Information Victory": {
      label: "Narrative Dominance Achieved",
      flavour:
        "A sustained information operation achieves measurable public opinion shifts in key NATO member states.",
    },
  },

  phase_flavour: {
    CompetitiveNormality:
      "The Baltic region simmers. Beneath the surface of normalcy, both blocs probe for advantage.",
    HybridCoercion:
      "Hybrid pressure escalates. Cyber, proxies, and economic leverage replace diplomatic niceties.",
    AcutePolycrisis:
      "Multiple crises converge simultaneously. Alliance solidarity is under severe stress.",
    WarTransition:
      "The threshold of open conflict approaches. Mobilisation orders are being drafted.",
    OvertInterstateWar:
      "Conventional war is underway. The Baltic states are a battlefield.",
    GeneralizedBlocWar:
      "Bloc-level war engulfs Europe. Strategic weapons are no longer off the table.",
  },
};
