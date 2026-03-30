import type { ScenarioLocale } from "../types/scenario-locale";

export const hormuzFlashpointLocale: ScenarioLocale = {
  scenario_id: "hormuz-flashpoint-v1",
  display_name: "Strait of Hormuz Flashpoint",
  theatre: "Persian Gulf / Strait of Hormuz",
  setting_description:
    "The world's most critical maritime chokepoint is at breaking point. US CENTCOM and IRGC naval forces shadow each other in the narrow strait as tanker seizures, drone strikes, and covert mine operations push the region toward open conflict. Every decision ripples across global energy markets.",
  blue_faction_name: "US 5th Fleet / GCC Coalition",
  red_faction_name: "IRGC / Islamic Republic of Iran",
  actor_names: {
    us_5th_fleet_gcc: "US 5th Fleet / GCC Coalition",
    irgc_iran: "IRGC / Islamic Republic of Iran",
    houthi_movement: "Houthi Movement",
    gulf_tanker_fleet: "Gulf Tanker Fleet",
    gulf_energy_infra: "Gulf Energy Infrastructure",
  },
  actor_flags: {
    us_5th_fleet_gcc: "🇺🇸🇸🇦🇦🇪",
    irgc_iran: "🇮🇷",
    houthi_movement: "⚑",
    gulf_tanker_fleet: "🚢",
    gulf_energy_infra: "🛢️",
  },
  domains: {
    Kinetic: {
      label: "Naval & Air Combat",
      description:
        "US carrier strike groups and IRGC fast boats contest the strait and surrounding airspace.",
    },
    MaritimeLogistics: {
      label: "Strait Transit & Tankers",
      description:
        "The 35km Strait of Hormuz is the world's most critical oil chokepoint — mines, seizures, and naval presence directly control global energy supply.",
    },
    Energy: {
      label: "Gulf Oil & Gas",
      description:
        "Saudi Aramco, Iranian oil fields, and LNG terminals represent economic weapons of mass disruption.",
    },
    GeoeconomicIndustrial: {
      label: "Global Energy Markets",
      description:
        "Oil price shocks, shipping insurance collapse, and sanctions ripple through the world economy with every escalation.",
    },
    Cyber: {
      label: "Cyber Operations",
      description:
        "IRGC cyber units and US Cyber Command contest industrial control systems, oil facility networks, and military communications.",
    },
    SpacePnt: {
      label: "Space & Navigation",
      description:
        "GPS precision and satellite coverage determine targeting accuracy and safe maritime navigation through the strait.",
    },
    InformationCognitive: {
      label: "Information & Influence",
      description:
        "IRGC information operations, GCC media, and international opinion shape the legitimacy of each side's actions.",
    },
    DomesticPoliticalFiscal: {
      label: "Political Will & Finance",
      description:
        "US Congressional resolve, GCC solidarity, and Iranian domestic stability determine how long each side can sustain operations.",
    },
  },
  action_locales: {
    us_5th_fleet_gcc: {
      Escalate: {
        label: "Heighten CENTCOM Readiness",
        flavour:
          "Raise DEFCON-equivalent alert levels across 5th Fleet assets, signalling US resolve and preparing for contingency operations.",
      },
      DeEscalate: {
        label: "CENTCOM Stand-Down Signal",
        flavour:
          "Reduce visible military posture and open backchannel communication to avoid miscalculation.",
      },
      Reinforce: {
        label: "Fortify US Position",
        flavour:
          "Harden military and infrastructure assets in the Gulf region against adversary pressure.",
      },
      Disrupt: {
        label: "Disrupt IRGC Operations",
        flavour:
          "Conduct operations to degrade IRGC maritime or cyber capacity in the targeted domain.",
      },
      Mobilize: {
        label: "Surge 5th Fleet Assets",
        flavour:
          "Deploy additional carrier strike group assets, mine countermeasure vessels, or air power to the Gulf.",
      },
      Negotiate: {
        label: "Backchannel Diplomacy",
        flavour:
          "Engage Iranian interlocutors through Omani or Swiss diplomatic channels to reduce escalation risk.",
      },
      CyberAttack: {
        label: "USCYBERCOM Operation",
        flavour:
          "Execute an offensive cyber operation targeting IRGC command systems, oil facility infrastructure, or nuclear program networks.",
      },
      InformationOp: {
        label: "CENTCOM Public Affairs Campaign",
        flavour:
          "Deploy US information operations to frame Iranian actions as illegal and build international coalition legitimacy.",
      },
      SanctionImpose: {
        label: "US Treasury Sanctions Wave",
        flavour:
          "Coordinate a new OFAC sanctions package targeting Iranian oil exports, shipping companies, and IRGC financial networks.",
      },
      SanctionRelief: {
        label: "Partial Sanctions Relief",
        flavour:
          "Ease selected oil sanctions as a diplomatic inducement for Iranian de-escalation in the Strait.",
      },
      MilitaryDeploy: {
        label: "Carrier Strike Group Deployment",
        flavour:
          "Order an additional CSG into the Gulf of Oman, demonstrating overwhelming conventional superiority.",
      },
      NavalBlockade: {
        label: "Gulf Maritime Interdiction",
        flavour:
          "Establish a US-led naval cordon to interdict Iranian oil exports and IRGC arms shipments.",
      },
      SpaceAssetDeploy: {
        label: "Gulf ISR Enhancement",
        flavour:
          "Task additional reconnaissance satellites and Poseidon MPA to provide persistent strait surveillance coverage.",
      },
      DomesticPolicyShift: {
        label: "Congressional Authorisation Push",
        flavour:
          "Secure Congressional AUMF and allied political commitment to sustain long-term Gulf operations.",
      },
    },
    irgc_iran: {
      Escalate: {
        label: "IRGC Force Posture Escalation",
        flavour:
          "Increase IRGC naval activity in the strait and activate reserve Basij forces to signal resolve.",
      },
      DeEscalate: {
        label: "Iranian Diplomatic Signal",
        flavour:
          "Withdraw fast boats and convey through intermediaries a willingness to negotiate over sanctions.",
      },
      Reinforce: {
        label: "Fortify Iranian Defences",
        flavour:
          "Harden coastal missile batteries, underground facilities, and cyber defences against US strike options.",
      },
      Disrupt: {
        label: "Undermine GCC Cohesion",
        flavour:
          "Exploit divisions within the GCC coalition through diplomatic pressure, economic inducements, and covert operations.",
      },
      Mobilize: {
        label: "Mobilise IRGC Navy",
        flavour:
          "Activate additional IRGC fast boats, submarines, and mine-laying vessels for sustained strait operations.",
      },
      Negotiate: {
        label: "Tehran Diplomatic Overture",
        flavour:
          "Signal flexibility on nuclear commitments or Houthi restraint to buy time or extract sanctions relief.",
      },
      CyberAttack: {
        label: "IRGC Cyber Unit Operation",
        flavour:
          "Deploy IRGC Unit 84 against Saudi Aramco control systems, US Naval networks, or GCC financial infrastructure.",
      },
      InformationOp: {
        label: "Iranian Information Campaign",
        flavour:
          "Amplify anti-Western narratives across Gulf media and social networks, framing the US as the aggressor.",
      },
      SanctionImpose: {
        label: "Oil Export Weaponisation",
        flavour:
          "Threaten to close the strait to all tanker traffic, weaponising Iran's ability to disrupt global energy supply.",
      },
      SanctionRelief: {
        label: "Energy Export Restoration",
        flavour:
          "Resume full oil exports as a signal of goodwill or in response to partial sanctions relief.",
      },
      MilitaryDeploy: {
        label: "IRGC Naval Surge",
        flavour:
          "Deploy additional IRGC fast attack craft, mine-laying vessels, and anti-ship missile batteries to strait chokepoints.",
      },
      NavalBlockade: {
        label: "Strait Closure Threat",
        flavour:
          "Position IRGC assets to credibly threaten closure of the Strait of Hormuz to all tanker traffic.",
      },
      SpaceAssetDeploy: {
        label: "Iranian Surveillance Enhancement",
        flavour:
          "Activate Iranian drone and satellite reconnaissance to track US naval movements in the Gulf.",
      },
      DomesticPolicyShift: {
        label: "Supreme Leader Consolidation",
        flavour:
          "Invoke the domestic rally-around-the-flag effect, restricting dissent and mobilising the Iranian war economy.",
      },
    },
  },
  stochastic_events: {
    "IRGC Fast Boat Swarm": {
      label: "IRGC Fast Boat Swarm Attack",
      flavour:
        "A swarm of IRGC fast attack craft conducts a high-speed intercept of a US naval vessel in international waters.",
    },
    "Tanker Seizure in Strait": {
      label: "Iranian Tanker Seizure",
      flavour:
        "IRGC commandos rappel onto a flagged tanker in the Strait, triggering an international maritime incident.",
    },
    "Drone Strike on Aramco Facility": {
      label: "Drone Strike: Saudi Aramco",
      flavour:
        "Iranian-linked drones strike a Saudi Aramco processing facility, briefly cutting 5% of global oil supply.",
    },
    "US Carrier Strike Group Arrival": {
      label: "CSG Enters Gulf of Oman",
      flavour:
        "A US carrier strike group transits the Strait of Hormuz and takes up position in the Gulf of Oman.",
    },
    "Houthi Ballistic Missile Launch": {
      label: "Houthi Ballistic Missile Barrage",
      flavour:
        "Houthi forces launch a barrage of ballistic missiles at GCC military installations in Saudi Arabia and the UAE.",
    },
    "Oil Price Shock": {
      label: "Global Oil Price Shock",
      flavour:
        "Strait tensions trigger a 25% oil price spike, destabilising global financial markets and straining defence budgets.",
    },
    "Iranian Mine Deployment": {
      label: "Covert Mine Laying Operation",
      flavour:
        "Intelligence confirms IRGC mine-laying vessels have seeded portions of the strait with contact mines overnight.",
    },
    "Strait GPS Jamming": {
      label: "GPS Jamming Over Strait",
      flavour:
        "Sophisticated GPS jamming blankets the strait, forcing tankers onto manual navigation and disrupting US precision weapons.",
    },
    "Gulf Disinformation Surge": {
      label: "Iranian Disinformation Surge",
      flavour:
        "A coordinated disinformation campaign floods regional media with fabricated footage of US aggression in the Gulf.",
    },
    "GCC Emergency Summit": {
      label: "GCC Emergency Security Summit",
      flavour:
        "Gulf leaders convene an emergency summit, producing a joint communiqué that strengthens coalition solidarity.",
    },
    "China Diplomatic Intervention": {
      label: "Beijing Diplomatic Intervention",
      flavour:
        "China's foreign minister conducts shuttle diplomacy between Tehran and Riyadh, proposing a de-escalation framework.",
    },
    "Cyberattack on Abqaiq Facility": {
      label: "Cyberattack: Abqaiq Oil Facility",
      flavour:
        "A sophisticated cyberattack penetrates industrial control systems at the Abqaiq oil processing complex.",
    },
    "US Sanctions Escalation": {
      label: "US Treasury Sanctions Escalation",
      flavour:
        "Washington announces sweeping new sanctions targeting Iranian oil exports, banking, and IRGC commanders.",
    },
    "IRGC Submarine Activity": {
      label: "IRGC Submarine Detected",
      flavour:
        "A US P-8 Poseidon locates an IRGC submarine conducting close surveillance of the carrier strike group.",
    },
    "Houthi Sea Mine Strike": {
      label: "Houthi Sea Mine Strike",
      flavour:
        "A commercial tanker strikes a Houthi-laid sea mine in the Red Sea, flooding the engine room.",
    },
    "Iranian Nuclear Signal": {
      label: "Iranian Nuclear Enrichment Signal",
      flavour:
        "Iran announces enrichment to 90% purity at Fordow, crossing a red line that triggers international alarm.",
    },
    "Red Sea Shipping Diversion": {
      label: "Red Sea Route Abandonment",
      flavour:
        "Major shipping companies divert vessels away from the Red Sea and Hormuz, adding weeks to global transit times.",
    },
    "US Embassy Evacuation": {
      label: "US Embassy Evacuation Order",
      flavour:
        "Washington orders non-essential staff evacuated from Gulf embassies as the threat level reaches CRITICAL.",
    },
    "GCC Air Defense Alert": {
      label: "GCC Air Defense Activation",
      flavour:
        "GCC air defence systems go to maximum alert following detection of multiple approaching ballistic missile trajectories.",
    },
    "Oil Tanker Insurance Collapse": {
      label: "Tanker Insurance Market Collapse",
      flavour:
        "Lloyd's of London withdraws coverage for Gulf-transiting tankers, effectively halting commercial shipping through the strait.",
    },
  },
  phase_flavour: {
    CompetitiveNormality:
      "An uneasy calm prevails over the Gulf. IRGC and US forces shadow each other in the narrow strait.",
    HybridCoercion:
      "Tanker seizures and drone strikes escalate. The strait is becoming a zone of coercive competition.",
    AcutePolycrisis:
      "Mine warfare, cyber attacks, and oil price shocks converge. The Gulf economy is fracturing.",
    WarTransition:
      "The strait is effectively closed. CENTCOM and IRGC are on war footing.",
    OvertInterstateWar:
      "Open naval combat in the Strait. Oil exports have ceased. Global markets in freefall.",
    GeneralizedBlocWar:
      "Regional war has gone global. The Strait of Hormuz is a war zone. Strategic thresholds dissolving.",
  },
};
