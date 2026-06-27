/**
 * Seed script for AI Job Discovery Platform.
 * Creates 25+ companies and 60+ jobs across multiple categories, plus a demo user.
 */
import { db } from "../src/lib/db"
import * as bcrypt from "bcrypt"
import type { Company } from "@prisma/client"

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}
function daysAhead(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

const COMPANIES = [
  {
    name: "Neural Labs", industry: "Artificial Intelligence", size: "201-1000", founded: 2019,
    headquarters: "San Francisco, CA", rating: 4.7, verified: true,
    mission: "Democratize intelligence by building open AI systems that augment every human.",
    description: "Neural Labs builds foundation models and developer tools that power the next generation of AI applications. Our research team has shipped breakthroughs in multimodal reasoning and agentic systems.",
    techStack: ["Python", "PyTorch", "Rust", "Kubernetes", "Ray", "Triton", "CUDA", "Next.js"],
    benefits: ["Unlimited PTO", "Top-tier health insurance", "Equity for all", "$5k learning budget", "Remote-friendly"],
  },
  {
    name: "Quantum Forge", industry: "Quantum Computing", size: "51-200", founded: 2020,
    headquarters: "Boston, MA", rating: 4.5, verified: true,
    mission: "Build the first commercially useful quantum computer.",
    description: "Quantum Forge is a hardware-software company pioneering superconducting qubit systems with error correction. We collaborate with national labs and Fortune 500 enterprises.",
    techStack: ["Qiskit", "Cirq", "Python", "C++", "FPGA", "Verilog", "LabVIEW"],
    benefits: ["Equity", "Relocation package", "Conference travel", "Gym membership"],
  },
  {
    name: "Helix Health", industry: "Healthcare / Biotech", size: "1000+", founded: 2015,
    headquarters: "Cambridge, MA", rating: 4.3, verified: true,
    mission: "Engineer biology to cure disease.",
    description: "Helix Health is a genome-medicine company using CRISPR and ML to develop one-time curative therapies for genetic diseases.",
    techStack: ["Python", "R", "TensorFlow", "AWS", "Nextflow", "Spark", "Snowflake"],
    benefits: ["Stock options", "401k match", "On-site clinic", "Parental leave 6 months"],
  },
  {
    name: "Stellar Finance", industry: "Fintech", size: "201-1000", founded: 2017,
    headquarters: "New York, NY", rating: 4.2, verified: true,
    mission: "Rebuild the financial system on programmable rails.",
    description: "Stellar Finance provides treasury, payments, and yield infrastructure for internet businesses. We process billions of dollars annually across 40+ countries.",
    techStack: ["Go", "TypeScript", "Postgres", "Kafka", "Kubernetes", "Solidity"],
    benefits: ["Stock options", "401k 6% match", "Commuter benefits", "Lunch stipend"],
  },
  {
    name: "Aurora Robotics", industry: "Robotics", size: "51-200", founded: 2018,
    headquarters: "Pittsburgh, PA", rating: 4.6, verified: true,
    mission: "Put a robot in every warehouse, hospital and home.",
    description: "Aurora builds general-purpose manipulation robots powered by vision-language-action models. Our fleet operates 24/7 across logistics customers.",
    techStack: ["C++", "Python", "ROS2", "PyTorch", "CUDA", "Webots"],
    benefits: ["Equity", "Relocation", "Robot petting zoo", "Hardware budget"],
  },
  {
    name: "Verdant Energy", industry: "Climate Tech", size: "201-1000", founded: 2016,
    headquarters: "Austin, TX", rating: 4.4, verified: true,
    mission: "Power the planet on clean electrons.",
    description: "Verdant builds grid-scale battery storage and AI-driven energy trading. Our software orchestrates 4 GWh of storage across three continents.",
    techStack: ["Python", "Rust", "Go", "InfluxDB", "TimescaleDB", "React"],
    benefits: ["Equity", "EV lease discount", "Solar credit", "Climate offset"],
  },
  {
    name: "Lumen VR", industry: "AR / VR", size: "11-50", founded: 2021,
    headquarters: "Seattle, WA", rating: 4.1, verified: false,
    mission: "Replace every screen with spatial computing.",
    description: "Lumen VR builds the operating system for next-generation mixed reality headsets.",
    techStack: ["C++", "Unity", "Unreal", "OpenXR", "Vulkan", "Metal"],
    benefits: ["Equity", "Headset of choice", "Game budget"],
  },
  {
    name: "Cipher Security", industry: "Cybersecurity", size: "201-1000", founded: 2014,
    headquarters: "Tel Aviv, IL", rating: 4.5, verified: true,
    mission: "Make the internet safer than the physical world.",
    description: "Cipher builds zero-trust identity and runtime protection for cloud workloads.",
    techStack: ["Rust", "Go", "eBPF", "WASM", "Postgres", "Kubernetes"],
    benefits: ["Equity", "Bug bounty bonus", "Conference budget", "Insurance"],
  },
  {
    name: "Mosaic Commerce", industry: "E-commerce", size: "1000+", founded: 2012,
    headquarters: "Toronto, CA", rating: 4.0, verified: true,
    mission: "Make commerce accessible to every entrepreneur.",
    description: "Mosaic is a multi-channel commerce platform powering 200k+ SMBs.",
    techStack: ["Ruby", "Rails", "React", "GraphQL", "Postgres", "Redis"],
    benefits: ["Stock", "RRSP match", "Parental leave", "WFH stipend"],
  },
  {
    name: "Prism Design Studio", industry: "Design / Creative", size: "11-50", founded: 2019,
    headquarters: "Lisbon, PT", rating: 4.8, verified: false,
    mission: "Design that respects users and the planet.",
    description: "Prism is a design partner for ambitious product teams. We do brand, product, and motion.",
    techStack: ["Figma", "After Effects", "Webflow", "Three.js", "GSAP"],
    benefits: ["Profit share", "Sabbatical", "Coworking pass", "Toolkit"],
  },
  {
    name: "Cobalt Games", industry: "Gaming", size: "201-1000", founded: 2013,
    headquarters: "Los Angeles, CA", rating: 4.4, verified: true,
    mission: "Build games that players love for decades.",
    description: "Cobalt is an independent AAA studio crafting narrative-driven RPGs.",
    techStack: ["C++", "Unreal", "C#", "Unity", "Maya", "Houdini"],
    benefits: ["Equity", "Royalty bonus", "Game budget", "Ergonomic setup"],
  },
  {
    name: "Pulse Media", industry: "Media / Streaming", size: "1000+", founded: 2010,
    headquarters: "Los Gatos, CA", rating: 3.9, verified: true,
    mission: "Entertain the world.",
    description: "Pulse is a global streaming service reaching 250M subscribers.",
    techStack: ["Java", "Go", "React", "Swift", "Kotlin", "Kafka", "Cassandra"],
    benefits: ["Stock", "401k", "Streaming free for life", "Catered meals"],
  },
  {
    name: "Anvil Cloud", industry: "Cloud Infrastructure", size: "1000+", founded: 2011,
    headquarters: "Seattle, WA", rating: 4.2, verified: true,
    mission: "Cloud that scales with you, not against you.",
    description: "Anvil is a hyperscaler alternative focusing on performance, simplicity, and price.",
    techStack: ["Rust", "Go", "C", "Linux", "Kubernetes", "Terraform"],
    benefits: ["Stock", "401k match", "Commuter", "Wellness"],
  },
  {
    name: "Nimbus Apps", industry: "SaaS / Productivity", size: "51-200", founded: 2018,
    headquarters: "Berlin, DE", rating: 4.6, verified: true,
    mission: "Make work calmer and more focused.",
    description: "Nimbus builds the calm productivity suite used by 1M+ knowledge workers.",
    techStack: ["TypeScript", "Next.js", "Postgres", "Prisma", "tRPC"],
    benefits: ["Stock", "4-day week", "Sabbatical", "WFH setup"],
  },
  {
    name: "Forge Manufacturing", industry: "Manufacturing / Industry 4.0", size: "201-1000", founded: 2010,
    headquarters: "Munich, DE", rating: 4.1, verified: true,
    mission: "Bring software velocity to physical production.",
    description: "Forge builds factory execution software and IoT sensors for durable goods makers.",
    techStack: ["Python", "Go", "TimescaleDB", "MQTT", "React", "ROS"],
    benefits: ["Pension", "Wellness", "Bike lease", "Cafeteria"],
  },
  {
    name: "Beacon Edu", industry: "EdTech", size: "51-200", founded: 2019,
    headquarters: "Bengaluru, IN", rating: 4.5, verified: true,
    mission: "Quality education for every learner on Earth.",
    description: "Beacon builds personalized learning experiences for K-12 and skills learners across emerging markets.",
    techStack: ["React", "React Native", "Node.js", "MongoDB", "AWS"],
    benefits: ["ESOPs", "Learning stipend", "Health", "Flex hours"],
  },
  {
    name: "Tidal Logistics", industry: "Supply Chain / Logistics", size: "1000+", founded: 2009,
    headquarters: "Rotterdam, NL", rating: 3.8, verified: true,
    mission: "Move goods with the speed of bits.",
    description: "Tidal is a global freight forwarder with a digital backbone.",
    techStack: ["Java", "Spring", "Angular", "Postgres", "Kafka"],
    benefits: ["Pension", "Travel perks", "Gym"],
  },
  {
    name: "Vertex Bio", industry: "Biotech / Genomics", size: "11-50", founded: 2022,
    headquarters: "Zurich, CH", rating: 4.7, verified: false,
    mission: "Program cells like software.",
    description: "Vertex Bio is a synthetic-biology platform company serving pharma R&D.",
    techStack: ["Python", "R", "Benchling", "PyTorch", "AWS"],
    benefits: ["Equity", "Relocation", "Conference"],
  },
  {
    name: "Quasar Aerospace", industry: "Aerospace", size: "201-1000", founded: 2015,
    headquarters: "Hawthorne, CA", rating: 4.3, verified: true,
    mission: "Make humanity multi-planetary.",
    description: "Quasar builds reusable launch vehicles and in-space transportation.",
    techStack: ["C++", "Python", "LabVIEW", "MATLAB", "Simulink"],
    benefits: ["Stock", "Relocation", "On-site meals"],
  },
  {
    name: "Lattice Data", industry: "Data Infrastructure", size: "51-200", founded: 2020,
    headquarters: "Remote", rating: 4.6, verified: true,
    mission: "The warehouse is dead; long live the lakehouse.",
    description: "Lattice builds the open lakehouse engine used by data teams at 500+ companies.",
    techStack: ["Rust", "Apache Arrow", "Iceberg", "Kafka", "TypeScript"],
    benefits: ["Equity", "Fully remote", "Coworking stipend", "Health"],
  },
  {
    name: "Drift Mobility", industry: "Autonomous Vehicles", size: "201-1000", founded: 2017,
    headquarters: "Phoenix, AZ", rating: 4.0, verified: true,
    mission: "Safe, autonomous mobility for everyone.",
    description: "Drift operates a Level-4 robotaxi service in five cities.",
    techStack: ["C++", "Python", "PyTorch", "ROS2", "CUDA"],
    benefits: ["Stock", "Free rides", "Relocation"],
  },
  {
    name: "Cinder Studios", industry: "Animation / VFX", size: "51-200", founded: 2016,
    headquarters: "Vancouver, CA", rating: 4.5, verified: false,
    mission: "Tell stories that move generations.",
    description: "Cinder is an animation studio producing feature films and episodic series.",
    techStack: ["Maya", "Houdini", "Nuke", "Python", "Unreal"],
    benefits: ["Profit share", "Family leave", "Catering"],
  },
  {
    name: "Coral Marine", industry: "Ocean Tech", size: "11-50", founded: 2021,
    headquarters: "Singapore", rating: 4.4, verified: false,
    mission: "Map and protect the ocean.",
    description: "Coral builds autonomous underwater vehicles and a marine data platform.",
    techStack: ["Rust", "Python", "ROS2", "Go", "Postgres"],
    benefits: ["Equity", "Field trips", "Diving cert"],
  },
  {
    name: "Cresta Real Estate", industry: "PropTech", size: "51-200", founded: 2018,
    headquarters: "Dubai, AE", rating: 4.0, verified: true,
    mission: "Reinvent how the world finds a home.",
    description: "Cresta is a digital brokerage and marketplace for residential real estate.",
    techStack: ["Next.js", "Node.js", "Postgres", "Mapbox", "Redis"],
    benefits: ["Equity", "Housing stipend", "Health"],
  },
  {
    name: "Northwind Travel", industry: "Travel / Hospitality", size: "201-1000", founded: 2014,
    headquarters: "Stockholm, SE", rating: 4.2, verified: true,
    mission: "Make sustainable travel the default.",
    description: "Northwind builds a travel platform that prices in carbon and offsets by default.",
    techStack: ["Go", "TypeScript", "React", "Postgres", "BigQuery"],
    benefits: ["Stock", "Travel credit", "Pension", "Parental leave"],
  },
  // ===== Nepal-based IT companies =====
  {
    name: "Fusemachines", industry: "AI / EdTech", size: "201-1000", founded: 2013,
    headquarters: "New York, NY / Kathmandu, NP", rating: 4.3, verified: true,
    mission: "Democratize AI through education and opportunity.",
    description: "Fusemachines is an AI talent and education company with a large engineering team in Kathmandu. We build AI products for global clients and run Fuse.ai for AI education.",
    techStack: ["Python", "TensorFlow", "PyTorch", "React", "Node.js", "AWS", "PostgreSQL"],
    benefits: ["Health insurance", "Learning stipend", "Flexible hours", "Global exposure"],
  },
  {
    name: "F1Soft", industry: "Fintech", size: "201-1000", founded: 2004,
    headquarters: "Kathmandu, NP", rating: 4.1, verified: true,
    mission: "Make digital payments accessible to every Nepali.",
    description: "F1Soft is Nepal's leading fintech company, powering mobile banking and digital payments for banks and remittance companies across the country.",
    techStack: ["Java", "Spring", "Kotlin", "Android", "iOS", "PostgreSQL", "Redis"],
    benefits: ["PF", "Gratuity", "Health", "Flexible leave"],
  },
  {
    name: "Deerwalk Services", industry: "Healthcare IT", size: "201-1000", founded: 2009,
    headquarters: "Kathmandu, NP", rating: 4.0, verified: true,
    mission: "Build software that improves healthcare outcomes.",
    description: "Deerwalk provides healthcare analytics and software services to US-based health insurance and provider clients.",
    techStack: ["Java", "Python", "React", "Spring Boot", "MySQL", "AWS"],
    benefits: ["PF", "Health", "Lunch", "Transportation"],
  },
  {
    name: "CloudFactory", industry: "Data / AI Training", size: "1000+", founded: 2008,
    headquarters: "Reading, UK / Kathmandu, NP", rating: 4.2, verified: true,
    mission: "Connect one million people to digital work.",
    description: "CloudFactory is a human-in-the-loop AI training data company with a large distributed workforce in Nepal and Kenya.",
    techStack: ["Python", "React", "Ruby on Rails", "AWS", "Kubernetes"],
    benefits: ["Health", "Learning budget", "Remote-friendly"],
  },
  {
    name: "BrainDigit", industry: "Software Development", size: "51-200", founded: 2010,
    headquarters: "Kathmandu, NP", rating: 3.9, verified: false,
    mission: "Build world-class software products from Nepal.",
    description: "BrainDigit is a software product company building ERP, e-commerce, and SaaS solutions for clients in South Asia and beyond.",
    techStack: [".NET", "C#", "Azure", "React", "SQL Server"],
    benefits: ["PF", "Health", "Snacks"],
  },
  {
    name: "Verisk Nepal", industry: "Data Analytics", size: "201-1000", founded: 2014,
    headquarters: "Kathmandu, NP", rating: 4.4, verified: true,
    mission: "Data-driven insights for risk and resilience.",
    description: "Verisk Nepal is the offshore engineering and analytics arm of Verisk Analytics (NASDAQ: VRSK), working on insurance, energy, and financial data products.",
    techStack: ["Python", "SQL", "R", "Java", "AWS", "Snowflake"],
    benefits: ["Health insurance", "PF", "Gratuity", "Wellness"],
  },
  {
    name: "Yomari", industry: "Software Development", size: "51-200", founded: 2007,
    headquarters: "Kathmandu, NP", rating: 3.8, verified: false,
    mission: "Engineer reliable software for emerging markets.",
    description: "Yomari builds custom software, BI dashboards, and data platforms for banks, telcos, and enterprises in Nepal and abroad.",
    techStack: ["Java", "Python", "React", "PostgreSQL", "Tableau"],
    benefits: ["PF", "Health", "Flex hours"],
  },
  {
    name: "Linho Tech", industry: "Mobile / Fintech", size: "11-50", founded: 2019,
    headquarters: "Kathmandu, NP", rating: 4.2, verified: false,
    mission: "Simplify payments and lending for the next billion.",
    description: "Linho is a young fintech startup building wallet and lending products for the Nepali market.",
    techStack: ["Kotlin", "Swift", "Node.js", "MongoDB", "AWS"],
    benefits: ["Equity", "Health", "MacBook"],
  },
  {
    name: "Vairav Technology", industry: "Software Development", size: "11-50", founded: 2017,
    headquarters: "Lalitpur, NP", rating: 4.0, verified: false,
    mission: "Pragmatic software for Nepal and beyond.",
    description: "Vairav builds web and mobile apps for clients in retail, education, and government.",
    techStack: ["React", "Node.js", "Flutter", "PostgreSQL", "AWS"],
    benefits: ["Health", "Flex hours", "Snacks"],
  },
  {
    name: "Naamche", industry: "Product Studio", size: "11-50", founded: 2020,
    headquarters: "Kathmandu, NP", rating: 4.5, verified: false,
    mission: "Help founders ship products that customers love.",
    description: "Naamche is a product design and engineering studio partnering with global startups from seed to Series A.",
    techStack: ["React", "Next.js", "TypeScript", "React Native", "Prisma"],
    benefits: ["Equity options", "Remote-friendly", "Conference budget"],
  },
  {
    name: "Ekdanttech Solutions", industry: "IT Services", size: "11-50", founded: 2016,
    headquarters: "Biratnagar, NP", rating: 3.7, verified: false,
    mission: "Bring IT jobs to Tier-2 cities in Nepal.",
    description: "Ekdanttech provides web and app development, hosting, and digital marketing services from its Biratnagar office.",
    techStack: ["PHP", "Laravel", "WordPress", "Android", "MySQL"],
    benefits: ["PF", "Health", "Transportation"],
  },
  {
    name: "Bhojpuri Tech", industry: "AgriTech", size: "11-50", founded: 2021,
    headquarters: "Birgunj, NP", rating: 3.8, verified: false,
    mission: "Modernize agriculture with software.",
    description: "Bhojpuri Tech builds farm-to-market supply chain and lending tools for farmers in the Terai region.",
    techStack: ["Django", "React", "PostgreSQL", "Twilio"],
    benefits: ["Health", "Flex hours", "Field travel"],
  },
]

type JobSeed = {
  title: string
  category: string
  subcategory?: string
  seniority: string
  employmentType: string
  remoteStatus: string
  location: string
  city: string
  country: string
  region: string
  salaryMin: number
  salaryMax: number
  equity?: string
  experienceYrs: number
  visaSponsor: boolean
  postedDaysAgo: number
  closingDaysAhead: number
  skills: string[]
  technologies: string[]
  tags: string[]
  requirements: string[]
  responsibilities: string[]
  niceToHave: string[]
  description: string
}

const JOB_TEMPLATES: Record<string, Omit<JobSeed, "title" | "category" | "subcategory" | "seniority">> = {
  swe: {
    employmentType: "full-time", remoteStatus: "hybrid", location: "San Francisco, CA",
    city: "San Francisco", country: "United States", region: "Americas",
    salaryMin: 140000, salaryMax: 220000, equity: "0.05% - 0.2%", experienceYrs: 3, visaSponsor: true,
    postedDaysAgo: 4, closingDaysAhead: 30,
    skills: ["System Design", "Algorithms", "Code Review", "Testing", "API Design", "Distributed Systems"],
    technologies: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"],
    tags: ["backend", "frontend", "fullstack"],
    requirements: [
      "3+ years building production web applications at scale",
      "Strong CS fundamentals in data structures, algorithms, and system design",
      "Experience owning features end-to-end from spec to production",
      "Excellent written and verbal communication skills",
    ],
    responsibilities: [
      "Design and ship user-facing features used by hundreds of thousands of people",
      "Collaborate cross-functionally with product, design, and ML teams",
      "Own the health of services you build — on-call, observability, performance",
      "Mentor junior engineers and review code with care",
    ],
    niceToHave: [
      "Experience with event-driven architecture and Kafka",
      "Open-source contributions",
      "Familiarity with Next.js, tRPC, and Prisma",
    ],
    description: "We're hiring an engineer to join our core product team. You'll work on features that touch millions of users and partner directly with product and ML teams to ship outcomes, not tickets.",
  },
  ml: {
    employmentType: "full-time", remoteStatus: "remote", location: "Remote (US)",
    city: "Remote", country: "United States", region: "Americas",
    salaryMin: 170000, salaryMax: 280000, equity: "0.1% - 0.4%", experienceYrs: 4, visaSponsor: true,
    postedDaysAgo: 7, closingDaysAhead: 45,
    skills: ["Machine Learning", "Statistics", "Experimentation", "Python", "ML Ops"],
    technologies: ["PyTorch", "Ray", "MLflow", "Kubernetes", "AWS SageMaker", "DVC"],
    tags: ["ml", "ai", "research"],
    requirements: [
      "MS or PhD in CS, Stats, or related field, or equivalent experience",
      "Strong publication or production track record in ML",
      "Comfortable working in Python and PyTorch",
      "Experience shipping ML models to production",
    ],
    responsibilities: [
      "Frame business problems as ML problems and design experiments",
      "Train, evaluate, and deploy models at scale",
      "Author technical design docs and review others'",
      "Mentor junior ML engineers",
    ],
    niceToHave: [
      "Publications at NeurIPS / ICML / ICLR",
      "Experience with LLM fine-tuning and RLHF",
      "Background in causal inference",
    ],
    description: "Help us push the frontier of applied ML. You'll work on hard problems with real-world impact, with compute and data resources to match.",
  },
  designer: {
    employmentType: "full-time", remoteStatus: "hybrid", location: "Lisbon, PT",
    city: "Lisbon", country: "Portugal", region: "EMEA",
    salaryMin: 60000, salaryMax: 110000, equity: "0.05% - 0.15%", experienceYrs: 3, visaSponsor: false,
    postedDaysAgo: 9, closingDaysAhead: 30,
    skills: ["Visual Design", "Interaction Design", "Prototyping", "Design Systems", "User Research"],
    technologies: ["Figma", "Framer", "Principle", "After Effects", "Webflow"],
    tags: ["design", "ux", "ui"],
    requirements: [
      "3+ years of product design experience shipping consumer or B2B products",
      "Strong portfolio demonstrating systems thinking and craft",
      "Comfortable prototyping in code or no-code tools",
      "Excellent collaboration skills",
    ],
    responsibilities: [
      "Own design for a product surface end-to-end",
      "Conduct user research and synthesize insights",
      "Contribute to and evolve our design system",
      "Partner closely with PM and engineering",
    ],
    niceToHave: [
      "Motion design skills",
      "Experience designing for international markets",
      "Brand or illustration experience",
    ],
    description: "We're looking for a designer who sweats the details and thinks in systems. You'll shape how millions of people experience our product.",
  },
  pm: {
    employmentType: "full-time", remoteStatus: "onsite", location: "New York, NY",
    city: "New York", country: "United States", region: "Americas",
    salaryMin: 150000, salaryMax: 230000, equity: "0.1% - 0.3%", experienceYrs: 5, visaSponsor: true,
    postedDaysAgo: 2, closingDaysAhead: 30,
    skills: ["Product Strategy", "Roadmapping", "User Research", "Analytics", "Stakeholder Management"],
    technologies: ["Amplitude", "Mixpanel", "Figma", "Notion", "Linear", "SQL"],
    tags: ["product", "strategy"],
    requirements: [
      "5+ years of product management experience",
      "Track record of shipping successful products",
      "Strong analytical and SQL skills",
      "Excellent written communication",
    ],
    responsibilities: [
      "Set strategy and roadmap for a product area",
      "Work with engineering and design to ship outcomes",
      "Talk to customers weekly and synthesize insights",
      "Define and track metrics that matter",
    ],
    niceToHave: [
      "Technical background or CS degree",
      "Experience in fintech or B2B SaaS",
    ],
    description: "Drive the next phase of our product. You'll partner with a world-class team and have outsized impact on the business.",
  },
  data: {
    employmentType: "full-time", remoteStatus: "remote", location: "Remote (EU)",
    city: "Remote", country: "European Union", region: "EMEA",
    salaryMin: 90000, salaryMax: 150000, equity: "0.05% - 0.15%", experienceYrs: 3, visaSponsor: false,
    postedDaysAgo: 5, closingDaysAhead: 30,
    skills: ["SQL", "Data Modeling", "ETL", "Analytics", "Experimentation"],
    technologies: ["dbt", "Snowflake", "Airflow", "Python", "Looker", "BigQuery"],
    tags: ["data", "analytics", "engineering"],
    requirements: [
      "3+ years building data pipelines and warehouses",
      "Strong SQL and Python skills",
      "Experience with dbt and a modern warehouse",
      "Excellent communication with non-technical stakeholders",
    ],
    responsibilities: [
      "Design and maintain our analytics engineering layer",
      "Partner with analysts and PMs to enable self-serve analytics",
      "Own data quality and observability",
      "Define and document key metrics",
    ],
    niceToHave: [
      "Experience with streaming (Kafka, Flink)",
      "Familiarity with semantic layers (dbt Semantic, Cube)",
    ],
    description: "Be the foundational analytics engineer on a small, high-trust data team. You'll shape how the company thinks about data.",
  },
  devops: {
    employmentType: "full-time", remoteStatus: "remote", location: "Remote (Global)",
    city: "Remote", country: "Global", region: "Global",
    salaryMin: 130000, salaryMax: 200000, equity: "0.05% - 0.2%", experienceYrs: 4, visaSponsor: true,
    postedDaysAgo: 11, closingDaysAhead: 45,
    skills: ["Linux", "Networking", "Kubernetes", "Observability", "Security"],
    technologies: ["Terraform", "Ansible", "Kubernetes", "Prometheus", "Grafana", "ArgoCD"],
    tags: ["devops", "sre", "platform"],
    requirements: [
      "4+ years running production infrastructure",
      "Deep Kubernetes experience",
      "Strong programming skills in Go or Python",
      "Experience with IaC at scale",
    ],
    responsibilities: [
      "Build and operate our multi-cloud platform",
      "Design CI/CD pipelines for fast, safe deploys",
      "Own observability and on-call quality",
      "Improve developer experience",
    ],
    niceToHave: [
      "CKA or CKAD certification",
      "Experience with platform engineering products",
    ],
    description: "Join our platform team and build the developer experience that powers our entire engineering org.",
  },
  sales: {
    employmentType: "full-time", remoteStatus: "hybrid", location: "Toronto, CA",
    city: "Toronto", country: "Canada", region: "Americas",
    salaryMin: 80000, salaryMax: 130000, equity: "0.02% - 0.1%", experienceYrs: 4, visaSponsor: false,
    postedDaysAgo: 6, closingDaysAhead: 30,
    skills: ["Account Management", "Sales Cycle", "Negotiation", "CRM", "Forecasting"],
    technologies: ["Salesforce", "Outreach", "Gong", "Zoom", "Notion"],
    tags: ["sales", "gtm"],
    requirements: [
      "4+ years closing SaaS deals",
      "Track record of meeting or exceeding quota",
      "Strong discovery and demo skills",
      "Comfortable selling to technical buyers",
    ],
    responsibilities: [
      "Own a territory and a quota",
      "Run full sales cycles from prospect to close",
      "Partner with SDRs, marketing, and customer success",
      "Provide field intelligence to product and marketing",
    ],
    niceToHave: [
      "Experience selling developer tools",
      "Bilingual English/French",
    ],
    description: "Join a high-performing GTM team selling a product customers love. Uncapped commission, real territory.",
  },
  marketing: {
    employmentType: "full-time", remoteStatus: "remote", location: "Remote (US)",
    city: "Remote", country: "United States", region: "Americas",
    salaryMin: 100000, salaryMax: 160000, equity: "0.05% - 0.15%", experienceYrs: 4, visaSponsor: false,
    postedDaysAgo: 8, closingDaysAhead: 30,
    skills: ["Brand", "Content", "Growth", "Analytics", "Storytelling"],
    technologies: ["HubSpot", "Figma", "Webflow", "Amplitude", "Ahrefs"],
    tags: ["marketing", "growth", "content"],
    requirements: [
      "4+ years in B2B SaaS marketing",
      "Strong writing and editorial skills",
      "Experience managing agencies and contractors",
      "Data-driven and comfortable with analytics",
    ],
    responsibilities: [
      "Own marketing for a product line",
      "Plan and ship campaigns end-to-end",
      "Build and manage a content calendar",
      "Report on pipeline contribution",
    ],
    niceToHave: ["Video production skills", "Public speaking experience"],
    description: "Tell the story of a category-defining product to the people who need to hear it.",
  },
  nepalSwe: {
    employmentType: "full-time", remoteStatus: "onsite", location: "Kathmandu, NP",
    city: "Kathmandu", country: "Nepal", region: "APAC",
    salaryMin: 1200000, salaryMax: 2400000, equity: "", experienceYrs: 3, visaSponsor: false,
    postedDaysAgo: 3, closingDaysAhead: 30,
    skills: ["System Design", "Algorithms", "Code Review", "Testing", "API Design"],
    technologies: ["Python", "JavaScript", "React", "Node.js", "PostgreSQL", "Git"],
    tags: ["backend", "frontend", "fullstack"],
    requirements: [
      "3+ years of professional software engineering experience",
      "Strong fundamentals in data structures, algorithms, and OOP",
      "Comfortable with English communication (written and verbal)",
      "Experience with at least one web framework (Django, Spring, React, etc.)",
    ],
    responsibilities: [
      "Design, build, and maintain scalable web applications",
      "Collaborate with cross-functional teams to ship features",
      "Write clean, tested, and well-documented code",
      "Participate in code reviews and mentor junior engineers",
    ],
    niceToHave: [
      "Experience with cloud platforms (AWS, Azure, GCP)",
      "Open-source contributions",
      "Experience in agile/Scrum environments",
    ],
    description: "We're hiring a software engineer to join our Kathmandu office. You'll work on products used by millions of users, with a team that values craft and ownership. Salary listed in NPR (annual).",
  },
  nepalMobile: {
    employmentType: "full-time", remoteStatus: "hybrid", location: "Kathmandu, NP",
    city: "Kathmandu", country: "Nepal", region: "APAC",
    salaryMin: 1500000, salaryMax: 3000000, equity: "", experienceYrs: 3, visaSponsor: false,
    postedDaysAgo: 5, closingDaysAhead: 30,
    skills: ["Mobile Development", "Mobile Architecture", "API Integration", "Testing"],
    technologies: ["Kotlin", "Swift", "React Native", "Flutter", "Firebase"],
    tags: ["mobile", "android", "ios"],
    requirements: [
      "3+ years building mobile apps (Android or iOS)",
      "Published at least one app to Play Store or App Store",
      "Familiarity with REST APIs and offline-first patterns",
      "Strong UX sensibility",
    ],
    responsibilities: [
      "Build and ship mobile features end-to-end",
      "Optimize app performance and battery usage",
      "Collaborate with backend and design teams",
      "Maintain app quality through testing and CI",
    ],
    niceToHave: ["Experience with fintech or payments", "Flutter cross-platform experience"],
    description: "Join our mobile team in Kathmandu to build fintech products that serve millions of Nepali users.",
  },
  nepalData: {
    employmentType: "full-time", remoteStatus: "onsite", location: "Kathmandu, NP",
    city: "Kathmandu", country: "Nepal", region: "APAC",
    salaryMin: 1000000, salaryMax: 2200000, equity: "", experienceYrs: 2, visaSponsor: false,
    postedDaysAgo: 4, closingDaysAhead: 30,
    skills: ["SQL", "Python", "Data Modeling", "ETL", "Analytics"],
    technologies: ["PostgreSQL", "Python", "Pandas", "Airflow", "Tableau", "Snowflake"],
    tags: ["data", "analytics"],
    requirements: [
      "2+ years in a data engineering or analytics role",
      "Strong SQL and Python skills",
      "Experience building ETL pipelines",
      "Comfortable working with stakeholders to define metrics",
    ],
    responsibilities: [
      "Build and maintain data pipelines",
      "Design dashboards and self-serve analytics",
      "Ensure data quality and documentation",
      "Partner with product and operations on insights",
    ],
    niceToHave: ["Experience with US healthcare data", "Snowflake or BigQuery"],
    description: "Help us scale our data platform serving US-based healthcare clients. Based out of our Kathmandu office.",
  },
  nepalQA: {
    employmentType: "full-time", remoteStatus: "onsite", location: "Lalitpur, NP",
    city: "Lalitpur", country: "Nepal", region: "APAC",
    salaryMin: 800000, salaryMax: 1500000, equity: "", experienceYrs: 2, visaSponsor: false,
    postedDaysAgo: 7, closingDaysAhead: 30,
    skills: ["Test Automation", "Manual Testing", "Bug Reporting", "Test Planning"],
    technologies: ["Selenium", "Cypress", "Postman", "JIRA", "Python"],
    tags: ["qa", "testing"],
    requirements: [
      "2+ years in QA (manual or automation)",
      "Experience with at least one automation framework",
      "Familiarity with REST API testing",
      "Strong attention to detail",
    ],
    responsibilities: [
      "Design and execute test plans",
      "Build and maintain automated test suites",
      "Triage bugs and work with developers on fixes",
      "Improve release quality and processes",
    ],
    niceToHave: ["Performance testing experience", "Mobile testing"],
    description: "Join our QA team to ensure the quality of products we ship to clients across Nepal and abroad.",
  },
}

// Pairs of (companyIndex, templateKey, title, category, subcategory, seniority)
const JOBS: Array<[number, keyof typeof JOB_TEMPLATES, string, string, string, string]> = [
  [0, "swe", "Senior Full-Stack Engineer", "Engineering", "Full-Stack", "senior"],
  [0, "ml", "Research Engineer — Multimodal LLMs", "AI/ML", "Research", "senior"],
  [0, "ml", "Member of Technical Staff — Training", "AI/ML", "Infrastructure", "mid"],
  [0, "swe", "Frontend Engineer — Developer Platform", "Engineering", "Frontend", "mid"],
  [0, "pm", "Product Manager — APIs", "Product", "Platform", "senior"],

  [1, "swe", "Quantum Compiler Engineer", "Engineering", "Compilers", "senior"],
  [1, "swe", "Firmware Engineer — Control Systems", "Engineering", "Firmware", "mid"],
  [1, "data", "Quantum Algorithms Researcher", "Research", "Algorithms", "lead"],

  [2, "ml", "ML Scientist — Genomics", "AI/ML", "Research", "senior"],
  [2, "swe", "Backend Engineer — Clinical Data", "Engineering", "Backend", "mid"],
  [2, "data", "Bioinformatics Analyst", "Data", "Bioinformatics", "mid"],
  [2, "pm", "Product Manager — Therapeutics", "Product", "Clinical", "senior"],

  [3, "swe", "Payments Platform Engineer", "Engineering", "Backend", "senior"],
  [3, "swe", "Senior Backend Engineer — Risk", "Engineering", "Backend", "senior"],
  [3, "pm", "Product Manager — Treasury", "Product", "Fintech", "senior"],
  [3, "data", "Senior Analytics Engineer", "Data", "Analytics", "senior"],
  [3, "marketing", "Growth Marketing Lead", "Marketing", "Growth", "lead"],

  [4, "swe", "Robotics Software Engineer", "Engineering", "Robotics", "mid"],
  [4, "ml", "Perception ML Engineer", "AI/ML", "Perception", "senior"],
  [4, "swe", "Controls Engineer", "Engineering", "Controls", "senior"],

  [5, "swe", "Grid Software Engineer", "Engineering", "Backend", "mid"],
  [5, "data", "Energy Markets Analyst", "Data", "Analytics", "mid"],
  [5, "pm", "Product Manager — Trading", "Product", "Energy", "senior"],

  [6, "swe", "Graphics Engineer — Rendering", "Engineering", "Graphics", "senior"],
  [6, "designer", "Senior Spatial Designer", "Design", "Spatial", "senior"],
  [6, "swe", "AR/VR SDK Engineer", "Engineering", "SDK", "mid"],

  [7, "swe", "Security Engineer — Detection", "Engineering", "Security", "senior"],
  [7, "swe", "Kernel Engineer (eBPF)", "Engineering", "Kernel", "senior"],
  [7, "devops", "Platform Engineer — Zero Trust", "Engineering", "Platform", "mid"],

  [8, "swe", "Senior Rails Engineer", "Engineering", "Backend", "senior"],
  [8, "pm", "Product Manager — Merchant Experience", "Product", "E-commerce", "senior"],
  [8, "sales", "Enterprise Account Executive", "Sales", "Enterprise", "senior"],
  [8, "marketing", "Content Marketing Manager", "Marketing", "Content", "mid"],

  [9, "designer", "Brand Designer", "Design", "Brand", "mid"],
  [9, "designer", "Senior Product Designer", "Design", "Product", "senior"],
  [9, "marketing", "Motion Designer", "Design", "Motion", "mid"],

  [10, "swe", "Gameplay Engineer — Unreal", "Engineering", "Gameplay", "mid"],
  [10, "swe", "Engine Programmer — C++", "Engineering", "Engine", "senior"],
  [10, "designer", "Narrative Designer", "Design", "Narrative", "senior"],
  [10, "pm", "Live Ops Producer", "Product", "Live Ops", "mid"],

  [11, "swe", "Senior Backend Engineer — Streaming", "Engineering", "Backend", "senior"],
  [11, "ml", "Recommendations ML Engineer", "AI/ML", "Recsys", "senior"],
  [11, "data", "Data Engineer — Streaming Pipeline", "Data", "Engineering", "mid"],
  [11, "pm", "Product Manager — Personalization", "Product", "ML Product", "senior"],

  [12, "swe", "Distributed Systems Engineer", "Engineering", "Backend", "senior"],
  [12, "devops", "Senior SRE — Networking", "Engineering", "SRE", "senior"],
  [12, "swe", "Kernel Engineer (Linux)", "Engineering", "Kernel", "senior"],

  [13, "swe", "Senior Full-Stack Engineer", "Engineering", "Full-Stack", "senior"],
  [13, "swe", "Mobile Engineer — React Native", "Engineering", "Mobile", "mid"],
  [13, "pm", "Product Manager — Calendar", "Product", "Productivity", "senior"],

  [14, "swe", "Industrial IoT Engineer", "Engineering", "IoT", "mid"],
  [14, "ml", "Predictive Maintenance ML Engineer", "AI/ML", "Predictive", "mid"],
  [14, "data", "Manufacturing Data Engineer", "Data", "Engineering", "mid"],

  [15, "swe", "Full-Stack Engineer — Learning", "Engineering", "Full-Stack", "mid"],
  [15, "ml", "Personalization ML Engineer", "AI/ML", "Recsys", "mid"],
  [15, "pm", "Product Manager — K-12", "Product", "Education", "senior"],

  [16, "swe", "Senior Java Engineer — Platform", "Engineering", "Backend", "senior"],
  [16, "data", "Supply Chain Data Scientist", "Data", "Science", "senior"],
  [16, "pm", "Product Manager — Routing", "Product", "Logistics", "senior"],

  [17, "ml", "Computational Biologist", "AI/ML", "Bioinformatics", "senior"],
  [17, "swe", "Lab Automation Engineer", "Engineering", "Automation", "mid"],

  [18, "swe", "Avionics Software Engineer", "Engineering", "Avionics", "senior"],
  [18, "swe", "GNC Engineer", "Engineering", "GNC", "senior"],
  [18, "ml", "Autonomous Systems ML Engineer", "AI/ML", "Robotics", "senior"],

  [19, "swe", "Rust Engineer — Query Engine", "Engineering", "Database", "senior"],
  [19, "swe", "Data Platform Engineer", "Engineering", "Backend", "mid"],
  [19, "devops", "DevRel Engineer", "Engineering", "DevRel", "mid"],

  [20, "ml", "Senior Perception Engineer", "AI/ML", "Perception", "senior"],
  [20, "swe", "Motion Planning Engineer", "Engineering", "Planning", "senior"],
  [20, "data", "Fleet Data Engineer", "Data", "Engineering", "mid"],

  [21, "designer", "Lead Animator", "Design", "Animation", "lead"],
  [21, "swe", "Pipeline TD — Houdini", "Engineering", "Pipeline", "senior"],

  [22, "swe", "Embedded Engineer — AUV", "Engineering", "Embedded", "mid"],
  [22, "ml", "Marine ML Engineer", "AI/ML", "Robotics", "mid"],

  [23, "swe", "Senior Full-Stack Engineer", "Engineering", "Full-Stack", "senior"],
  [23, "pm", "Product Manager — Marketplace", "Product", "Real Estate", "senior"],
  [23, "marketing", "Performance Marketing Lead", "Marketing", "Performance", "lead"],

  [24, "swe", "Backend Engineer — Booking", "Engineering", "Backend", "mid"],
  [24, "pm", "Product Manager — Sustainability", "Product", "Climate", "senior"],
  [24, "data", "Senior Analytics Engineer", "Data", "Analytics", "senior"],

  // ===== Nepal companies (indexes 25-36) =====
  // 25: Fusemachines
  [25, "nepalSwe", "AI Engineer — Computer Vision", "AI/ML", "Computer Vision", "mid"],
  [25, "nepalSwe", "Full-Stack Engineer — Fuse.ai", "Engineering", "Full-Stack", "senior"],
  [25, "nepalSwe", "Backend Engineer — Python", "Engineering", "Backend", "mid"],
  [25, "ml", "ML Engineer — LLM Applications", "AI/ML", "Applied", "senior"],
  // 26: F1Soft
  [26, "nepalSwe", "Senior Java Engineer — Payments", "Engineering", "Backend", "senior"],
  [26, "nepalMobile", "Android Engineer — Mobile Banking", "Engineering", "Mobile", "mid"],
  [26, "nepalMobile", "iOS Engineer — Mobile Banking", "Engineering", "Mobile", "mid"],
  [26, "nepalSwe", "DevOps Engineer", "Engineering", "DevOps", "mid"],
  // 27: Deerwalk
  [27, "nepalSwe", "Java Backend Engineer — Healthcare", "Engineering", "Backend", "mid"],
  [27, "nepalData", "Healthcare Data Analyst", "Data", "Analytics", "mid"],
  [27, "nepalSwe", "React Frontend Engineer", "Engineering", "Frontend", "mid"],
  // 28: CloudFactory
  [28, "nepalSwe", "Platform Engineer — Ruby on Rails", "Engineering", "Backend", "senior"],
  [28, "nepalData", "Data Pipeline Engineer", "Data", "Engineering", "mid"],
  [28, "nepalSwe", "QA Automation Engineer", "Engineering", "QA", "mid"],
  // 29: BrainDigit
  [29, "nepalSwe", "Senior .NET Engineer", "Engineering", "Backend", "senior"],
  [29, "nepalSwe", "React Frontend Developer", "Engineering", "Frontend", "mid"],
  // 30: Verisk Nepal
  [30, "nepalData", "Senior Data Engineer — Python", "Data", "Engineering", "senior"],
  [30, "nepalData", "Actuarial Data Analyst", "Data", "Analytics", "mid"],
  [30, "nepalSwe", "Java Backend Engineer — Risk", "Engineering", "Backend", "mid"],
  // 31: Yomari
  [31, "nepalSwe", "Full-Stack Engineer — BI Tools", "Engineering", "Full-Stack", "mid"],
  [31, "nepalData", "BI Dashboard Developer", "Data", "Analytics", "mid"],
  // 32: Linho Tech
  [32, "nepalMobile", "Senior Android Engineer — Fintech", "Engineering", "Mobile", "senior"],
  [32, "nepalSwe", "Node.js Backend Engineer", "Engineering", "Backend", "mid"],
  // 33: Vairav Technology
  [33, "nepalSwe", "React + Node.js Engineer", "Engineering", "Full-Stack", "mid"],
  [33, "nepalQA", "QA Engineer — Manual + Automation", "Engineering", "QA", "mid"],
  // 34: Naamche
  [34, "nepalSwe", "Senior Next.js Engineer", "Engineering", "Full-Stack", "senior"],
  [34, "nepalSwe", "React Native Engineer", "Engineering", "Mobile", "mid"],
  // 35: Ekdanttech
  [35, "nepalSwe", "Laravel Developer", "Engineering", "Backend", "mid"],
  [35, "nepalSwe", "WordPress Developer", "Engineering", "Web", "junior"],
  // 36: Bhojpuri Tech
  [36, "nepalSwe", "Django Backend Engineer — AgriTech", "Engineering", "Backend", "mid"],
  [36, "nepalSwe", "React Frontend Developer", "Engineering", "Frontend", "junior"],
]

async function main() {
  console.log("Clearing existing data…")
  await db.notification.deleteMany()
  await db.watchSource.deleteMany()
  await db.activity.deleteMany()
  await db.chatThread.deleteMany()
  await db.alert.deleteMany()
  await db.application.deleteMany()
  await db.savedJob.deleteMany()
  await db.resume.deleteMany()
  await db.job.deleteMany()
  await db.company.deleteMany()
  await db.user.deleteMany()

  // Demo user — Chandan (admin), based in Nepal, with real WhatsApp + email
  const passwordHash = await bcrypt.hash("changeme123", 12)
  const user = await db.user.create({
    data: {
      email: "admin@example.com",
      password: passwordHash,
      fullName: "Chandan",
      headline: "Admin · NepalCareer",
      bio: "Admin account for NepalCareer. Looking for IT roles in Nepal and remote.",
      location: "Kathmandu, Nepal",
      avatarUrl: null,
      role: "admin",
      whatsappNumber: "+9779800000000",
      phoneCountry: "Nepal",
      notifyWhatsapp: true,
      notifyEmail: true,
      notifyInApp: true,
    },
  })
  console.log("Created user:", user.email, "(admin)")

  // Companies
  const companyRecords: Company[] = []
  for (const c of COMPANIES) {
    const rec = await db.company.create({
      data: {
        name: c.name,
        slug: slugify(c.name),
        logoUrl: null,
        website: `https://${slugify(c.name)}.com`,
        industry: c.industry,
        size: c.size,
        founded: c.founded,
        headquarters: c.headquarters,
        description: c.description,
        mission: c.mission,
        techStack: JSON.stringify(c.techStack),
        benefits: JSON.stringify(c.benefits),
        rating: c.rating,
        verified: c.verified,
        followerCount: Math.floor(50 + Math.random() * 9500),
      },
    })
    companyRecords.push(rec)
  }
  console.log(`Created ${companyRecords.length} companies`)

  // Jobs
  let jobCount = 0
  for (const [companyIdx, tplKey, title, category, subcategory, seniority] of JOBS) {
    const company = companyRecords[companyIdx]
    if (!company) continue
    const tpl = JOB_TEMPLATES[tplKey]
    let salaryMin = tpl.salaryMin, salaryMax = tpl.salaryMax
    if (seniority === "lead" || seniority === "staff") { salaryMin = Math.round(salaryMin * 1.2); salaryMax = Math.round(salaryMax * 1.2) }
    if (seniority === "junior" || seniority === "intern") { salaryMin = Math.round(salaryMin * 0.65); salaryMax = Math.round(salaryMax * 0.7) }
    const slugBase = slugify(`${title}-${company.name}`)
    await db.job.create({
      data: {
        title,
        slug: `${slugBase}-${jobCount + 1}`,
        description: tpl.description,
        requirements: JSON.stringify(tpl.requirements),
        responsibilities: JSON.stringify(tpl.responsibilities),
        niceToHave: JSON.stringify(tpl.niceToHave),
        skills: JSON.stringify(tpl.skills),
        technologies: JSON.stringify(tpl.technologies),
        tags: JSON.stringify(tpl.tags),
        category,
        subcategory,
        companyId: company.id,
        location: tpl.location,
        city: tpl.city,
        country: tpl.country,
        region: tpl.region,
        remoteStatus: tpl.remoteStatus,
        employmentType: tpl.employmentType,
        seniority,
        salaryMin,
        salaryMax,
        salaryCurrency: "USD",
        equity: tpl.equity,
        experienceYrs: tpl.experienceYrs,
        visaSponsor: tpl.visaSponsor,
        featured: jobCount % 7 === 0,
        urgent: jobCount % 11 === 0,
        viewCount: Math.floor(50 + Math.random() * 4000),
        applicationCount: Math.floor(5 + Math.random() * 300),
        status: "open",
        sourceUrl: `${company.website}/careers/${slugBase}`,
        postedAt: daysAgo(tpl.postedDaysAgo),
        closingAt: daysAhead(tpl.closingDaysAhead),
      },
    })
    jobCount++
  }
  console.log(`Created ${jobCount} jobs`)

  // Update company.jobCount
  for (const c of companyRecords) {
    const n = await db.job.count({ where: { companyId: c.id } })
    await db.company.update({ where: { id: c.id }, data: { jobCount: n } })
  }

  // Seed a demo resume for the user
  const resume = await db.resume.create({
    data: {
      userId: user.id,
      fileName: "demo-resume.pdf",
      isPrimary: true,
      rawText: "Senior Software Engineer with 5+ years building scalable web applications and ML systems.",
      skills: JSON.stringify(["System Design", "Algorithms", "Code Review", "Testing", "Distributed Systems", "Machine Learning"]),
      technologies: JSON.stringify(["TypeScript", "React", "Node.js", "Python", "PostgreSQL", "Docker", "AWS", "PyTorch"]),
      experience: JSON.stringify([
        { role: "Senior Software Engineer", company: "CloudCo", start: "2022-06", end: "Present", bullets: ["Led migration to event-driven architecture", "Mentored 4 engineers"] },
        { role: "Software Engineer", company: "StartupX", start: "2020-03", end: "2022-05", bullets: ["Shipped 3 major features used by 200k users", "Cut p99 latency by 60%"] },
      ]),
      education: JSON.stringify([{ school: "UC Berkeley", degree: "BS Computer Science", start: "2015", end: "2019" }]),
      certifications: JSON.stringify(["AWS Solutions Architect"]),
      languages: JSON.stringify(["English (native)", "Spanish (intermediate)"]),
      careerCategory: "Engineering",
      targetRole: "Senior Full-Stack Engineer",
      yearsExp: 5,
      atsScore: 78,
      strengths: JSON.stringify(["Strong backend fundamentals", "Production ML experience", "Excellent system design"]),
      weaknesses: JSON.stringify(["Limited Kotlin/Android exposure", "No professional Rust yet"]),
      improvementSuggestions: JSON.stringify([
        "Add concrete metrics to each bullet (e.g. 'reduced latency by 60% from 800ms to 320ms')",
        "Include a 'Projects' section showcasing open-source work",
        "Add a brief technical summary at the top with key skills",
        "Use stronger action verbs — avoid 'Helped', 'Worked on'",
      ]),
      analysisCompletedAt: new Date(),
    },
  })
  console.log("Created resume:", resume.id)

  // Seed a few saved jobs
  const allJobs = await db.job.findMany({ take: 6, orderBy: { postedAt: "desc" } })
  for (const job of allJobs.slice(0, 3)) {
    await db.savedJob.create({ data: { userId: user.id, jobId: job.id } })
  }
  if (allJobs[3]) {
    await db.application.create({ data: { userId: user.id, jobId: allJobs[3].id, status: "applied", appliedAt: daysAgo(2), stageHistory: JSON.stringify([{ status: "applied", at: new Date().toISOString() }]) } })
  }
  if (allJobs[4]) {
    await db.application.create({ data: { userId: user.id, jobId: allJobs[4].id, status: "interview", appliedAt: daysAgo(8), stageHistory: JSON.stringify([{ status: "applied", at: new Date().toISOString() }, { status: "interview", at: new Date().toISOString() }]) } })
  }
  if (allJobs[5]) {
    await db.application.create({ data: { userId: user.id, jobId: allJobs[5].id, status: "wishlist", stageHistory: JSON.stringify([{ status: "wishlist", at: new Date().toISOString() }]) } })
  }

  await db.alert.create({
    data: {
      userId: user.id,
      name: "Senior Remote SWE",
      query: "Senior Software Engineer",
      filters: JSON.stringify({ remote: "remote", type: "full-time" }),
      frequency: "daily",
      active: true,
      lastTriggeredAt: daysAgo(1),
      matchCount: 12,
    },
  })

  await db.chatThread.create({
    data: {
      userId: user.id,
      title: "Career switch to ML",
      messages: JSON.stringify([
        { role: "user", content: "I'm a full-stack SWE wanting to pivot into ML. What should I focus on first?", ts: daysAgo(2).toISOString() },
        { role: "assistant", content: "Great question! Given your engineering background, I'd recommend a 3-phase approach:\n\n1. **Foundations (4-6 weeks)**: Math refresh (linear algebra, probability) + PyTorch basics. Book: *Deep Learning* by Goodfellow.\n2. **Applied ML (6-8 weeks)**: Take one course end-to-end (fast.ai or Coursera) and reproduce 2-3 papers.\n3. **Portfolio (4-6 weeks)**: Ship 1 substantial project — ideally something at the intersection of your SWE skills and ML (e.g. a recommendation API, an LLM-powered tool).\n\nYour SWE background is a *huge* asset — most ML practitioners struggle with productionization, which is exactly what you're strong at.", ts: daysAgo(2).toISOString() },
      ]),
    },
  })

  const acts = [
    { type: "saved_job", title: "Saved Senior Full-Stack Engineer at Neural Labs", meta: JSON.stringify({}), daysAgo: 1 },
    { type: "applied", title: "Applied to Senior Backend Engineer at Stellar Finance", meta: JSON.stringify({}), daysAgo: 2 },
    { type: "status_change", title: "Application moved to Interview at Pulse Media", meta: JSON.stringify({}), daysAgo: 3 },
    { type: "uploaded_resume", title: "Uploaded resume demo-resume.pdf", meta: JSON.stringify({}), daysAgo: 4 },
    { type: "created_alert", title: "Created alert: Senior Remote SWE", meta: JSON.stringify({}), daysAgo: 5 },
    { type: "ai_query", title: "Asked Career Advisor about ML pivot", meta: JSON.stringify({}), daysAgo: 5 },
  ]
  for (const a of acts) {
    await db.activity.create({
      data: {
        userId: user.id,
        type: a.type,
        title: a.title,
        meta: a.meta,
        createdAt: daysAgo(a.daysAgo),
      },
    })
  }
  console.log("Created activities and demo data")

  // ===== Watch sources — Nepal company career pages being "monitored" =====
  const watchSources = [
    { companyName: "Fusemachines", url: "https://fusemachines.com/careers", country: "Nepal", industry: "AI / EdTech" },
    { companyName: "F1Soft", url: "https://f1soft.com/careers", country: "Nepal", industry: "Fintech" },
    { companyName: "Deerwalk Services", url: "https://deerwalk.com/careers", country: "Nepal", industry: "Healthcare IT" },
    { companyName: "CloudFactory", url: "https://cloudfactory.com/careers", country: "Nepal", industry: "Data / AI Training" },
    { companyName: "Verisk Nepal", url: "https://verisknepal.com/careers", country: "Nepal", industry: "Data Analytics" },
    { companyName: "Naamche", url: "https://naamche.studio/careers", country: "Nepal", industry: "Product Studio" },
  ]
  for (const ws of watchSources) {
    await db.watchSource.create({
      data: {
        userId: user.id,
        ...ws,
        lastCheckedAt: daysAgo(1),
        lastJobCount: Math.floor(5 + Math.random() * 15),
        newJobsCount: Math.floor(Math.random() * 3),
        status: "active",
        discoveredJobs: JSON.stringify([
          { title: "Senior Engineer", postedAt: daysAgo(2).toISOString(), url: `${ws.url}/senior-engineer` },
          { title: "Junior Developer", postedAt: daysAgo(5).toISOString(), url: `${ws.url}/junior-developer` },
        ]),
      },
    })
  }
  console.log(`Created ${watchSources.length} watch sources`)

  // ===== Notifications =====
  const notifs = [
    {
      type: "watch_source_new",
      title: "New job at Fusemachines",
      body: "Fusemachines just posted: AI Engineer — Computer Vision (Kathmandu). Matches your resume by 82%.",
      meta: JSON.stringify({ jobId: null, companyName: "Fusemachines", matchScore: 82, url: "https://fusemachines.com/careers" }),
      channels: JSON.stringify(["in_app", "whatsapp", "email"]),
      deliveryLog: JSON.stringify([
        { channel: "whatsapp", status: "delivered", at: daysAgo(1).toISOString(), message: `Sent to ${user.whatsappNumber} via WhatsApp Business API` },
        { channel: "email", status: "delivered", at: daysAgo(1).toISOString(), message: `Sent to ${user.email}` },
        { channel: "in_app", status: "delivered", at: daysAgo(1).toISOString(), message: "Shown in notification center" },
      ]),
      read: false,
      daysAgo: 1,
    },
    {
      type: "watch_source_new",
      title: "New job at F1Soft",
      body: "F1Soft just posted: Android Engineer — Mobile Banking. You saved a similar role last week.",
      meta: JSON.stringify({ jobId: null, companyName: "F1Soft", url: "https://f1soft.com/careers" }),
      channels: JSON.stringify(["in_app", "whatsapp"]),
      deliveryLog: JSON.stringify([
        { channel: "whatsapp", status: "delivered", at: daysAgo(2).toISOString(), message: `Sent to ${user.whatsappNumber}` },
        { channel: "in_app", status: "delivered", at: daysAgo(2).toISOString(), message: "Shown" },
      ]),
      read: false,
      daysAgo: 2,
    },
    {
      type: "application_update",
      title: "Application status updated",
      body: "Your application at Pulse Media moved to Interview stage.",
      meta: JSON.stringify({ jobId: null }),
      channels: JSON.stringify(["in_app", "email"]),
      deliveryLog: JSON.stringify([
        { channel: "email", status: "delivered", at: daysAgo(3).toISOString(), message: `Sent to ${user.email}` },
        { channel: "in_app", status: "delivered", at: daysAgo(3).toISOString(), message: "Shown" },
      ]),
      read: true,
      daysAgo: 3,
    },
    {
      type: "system",
      title: "Welcome to NepalCareer Notifications",
      body: "You'll receive alerts here when new jobs match your criteria, or when monitored companies post new roles. Configure delivery channels in Settings.",
      meta: JSON.stringify({}),
      channels: JSON.stringify(["in_app"]),
      deliveryLog: JSON.stringify([
        { channel: "in_app", status: "delivered", at: daysAgo(5).toISOString(), message: "Shown" },
      ]),
      read: true,
      daysAgo: 5,
    },
  ]
  for (const n of notifs) {
    await db.notification.create({
      data: {
        userId: user.id,
        type: n.type,
        title: n.title,
        body: n.body,
        meta: n.meta,
        channels: n.channels,
        deliveryLog: n.deliveryLog,
        read: n.read,
        createdAt: daysAgo(n.daysAgo),
      },
    })
  }
  console.log(`Created ${notifs.length} notifications`)

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
