import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const learner1 = await prisma.user.findFirst({ where: { email: 'learner1@moat.local' } });

  if (!admin || !learner1) {
    throw new Error('Admin or learner1 not found — ensure seed has been run.');
  }

  const course = await prisma.course.create({
    data: {
      title: 'Lean & Green Supply Chain [Masterclass]',
      description: 'Discover how businesses can streamline inventory and supply chains using simple Lean techniques. Learn real-world case studies, practical tools like Kanban, Kaizen, JIT and ABC analysis, and how to apply digital solutions to improve flow and cut waste. Explore ESG strategies and reporting best practices to align sustainability with business goals and NI/ROI regulatory requirements.',
      status: 'PUBLISHED',
      quizRequirement: 'REQUIRED',
      passMarkPercent: 70,
      maxQuizAttempts: 3,
      modules: {
        create: [
          {
            order: 1,
            title: 'Value & Waste from a Lean Perspective',
            lessonText: `In Lean thinking, "value" is defined entirely from the customer's perspective — anything the customer is willing to pay for. Everything else is waste.

The 8 Categories of Waste (TIMWOODS)
- Transport: Unnecessary movement of materials or information
- Inventory: Excess stock beyond immediate need
- Motion: Unnecessary movement by people
- Waiting: Idle time when work is paused
- Overproduction: Producing more than is needed, sooner than needed
- Over-processing: Doing more work than the customer requires
- Defects: Errors requiring rework or scrapping
- Skills (unused): Failing to utilise people's knowledge and talents

Lean Steps to Mitigate Waste
1. Identify: Map your current process to expose hidden waste
2. Measure: Quantify the cost and frequency of each waste type
3. Eliminate or Reduce: Apply targeted Lean tools (Kanban, 5S, JIT)
4. Sustain: Embed continuous improvement (Kaizen) culture

Applying the Lean Lens to Supply Chain
In a supply chain context, waste often hides in long lead times, overstocked warehouses, excessive handling steps, and redundant approval workflows. Recognising these patterns is the first step toward a leaner, greener operation.`,
          },
          {
            order: 2,
            title: 'Lean Principles in Supply Chain Management (End-to-End)',
            lessonText: `The five core Lean principles, applied end-to-end across the supply chain:

1. Define Value
Understand what the end customer truly values. In supply chains this means delivering the right product, in the right quantity, at the right time — no more, no less.

2. Map the Value Stream
Use Value Stream Mapping (VSM) to visualise every step from raw material to delivered product. Identify which steps add value and which are pure waste.

3. Create Flow
Once waste is removed, make the remaining value-adding steps flow smoothly without interruption. Eliminate batch processing and hand-off delays.

4. Establish Pull
Use customer demand to trigger production and replenishment (pull), rather than pushing stock through the chain based on forecasts. Kanban is the key tool here.

5. Pursue Perfection (Kaizen)
Continuous improvement is never "done." Regular Kaizen events and daily stand-ups embed a culture of incremental, ongoing optimisation.

End-to-End Supply Chain Application
- Supplier relationships: Lean procurement, demand sharing, collaborative forecasting
- Inbound logistics: JIT deliveries, milk-run routes, cross-docking
- Warehousing: 5S organisation, slotting optimisation, FIFO discipline
- Outbound logistics: Route optimisation, consolidated shipments
- Returns: Streamlined reverse logistics to minimise cost and waste`,
          },
          {
            order: 3,
            title: 'Lean Digital Transformation in Supply Chain & Inventory',
            lessonText: `Digital tools amplify Lean — they make waste visible faster, enable real-time pull signals, and support data-driven Kaizen.

Key Digital Enablers

Digital Kanban Boards
Replace physical cards with cloud-based Kanban systems (e.g. Trello, Jira, or ERP-native tools). Real-time visibility of inventory levels and replenishment triggers across locations.

ERP & Inventory Management Systems
Centralise stock data to eliminate information silos. Automate reorder points based on actual consumption rather than manual estimates.

IoT & RFID Tracking
Real-time location and quantity data for pallets, containers, and products. Eliminate manual counts and reduce shrinkage.

Demand Forecasting & AI
Machine learning models improve forecast accuracy, reducing both overstock and stockouts. More accurate demand signals support true JIT replenishment.

Digital Value Stream Mapping
Tools like Miro, Lucidchart, or dedicated VSM software allow teams to collaboratively map and share process maps, making waste identification a team sport.

Supplier Portals
Share demand forecasts, orders, and quality data directly with suppliers to enable collaborative lean practices across your supply network.

Cross-Border & All-Island Considerations
For NI/IE supply chains, digital systems are critical for managing potential regulatory divergence. Real-time compliance checks, customs documentation automation, and dual-reporting capability reduce administrative burden significantly.`,
          },
          {
            order: 4,
            title: 'ESG Objectives, Impact & Reporting',
            lessonText: `ESG stands for Environmental, Social, and Governance — a framework for measuring a business's impact beyond financial performance.

Why ESG Matters for Supply Chains
- Regulatory pressure: NI and Ireland are developing distinct (and potentially diverging) ESG reporting obligations. Businesses operating cross-border must be prepared for dual compliance.
- Customer and investor expectations: Increasingly, contracts and investment decisions require demonstrated ESG performance.
- Risk management: A robust ESG strategy reduces supply chain disruption risk from climate events, social unrest, and governance failures.

The Three Pillars

Environmental (E)
- Carbon emissions (Scope 1, 2, and 3)
- Energy and water consumption
- Waste generation and diversion rates
- Packaging and transport impact

Social (S)
- Fair labour practices across your supply chain
- Supplier diversity and local sourcing
- Health, safety, and wellbeing
- Community impact

Governance (G)
- Ethical sourcing and anti-corruption policies
- Transparency and accountability in reporting
- Board oversight of ESG commitments
- Supplier code of conduct compliance

ESG Reporting Frameworks
Common frameworks relevant to NI/IE businesses:
- GRI (Global Reporting Initiative) — widely used, sector-specific
- CSRD (Corporate Sustainability Reporting Directive) — EU mandatory from 2025+
- CDP — climate disclosure
- UN SDGs — alignment with global sustainability goals

NI/ROI Regulatory Context
With potential regulatory divergence post-Brexit, NI businesses may face dual reporting obligations — aligning with both UK and EU frameworks. Building flexible, data-rich reporting systems now future-proofs your compliance position.`,
          },
          {
            order: 5,
            title: 'Environmental Best Practices to Green Your Supply Chain',
            lessonText: `Greening your supply chain means systematically reducing environmental impact at every stage, from supplier to end customer.

Key Practice Areas

1. Supplier Engagement
- Set minimum environmental standards for suppliers
- Prioritise local and regional suppliers to reduce transport emissions
- Collaborate on packaging reduction and take-back schemes

2. Transport & Logistics
- Consolidate shipments to maximise vehicle fill rates
- Shift to lower-emission transport modes where viable (rail, electric vehicles)
- Optimise delivery routes using digital tools
- Explore shared logistics with non-competing partners

3. Packaging
- Eliminate unnecessary packaging layers
- Transition to recycled or biodegradable materials
- Design for disassembly and reuse

4. Energy & Facilities
- Conduct energy audits of warehouses and distribution centres
- Install LED lighting and smart heating/cooling systems
- Source renewable energy for facilities
- Monitor and report on energy KPIs monthly

5. Circular Economy Principles
- Design products for longevity and repair
- Implement product take-back and refurbishment programmes
- Divert waste from landfill through reuse, recycling, or composting

Practical Sustainability Metrics to Track
- Kg CO2e per order shipped
- % of suppliers meeting environmental standards
- Waste diversion rate (%)
- Renewable energy as % of total consumption
- Water usage per unit produced

All-Island Supply Chain Opportunity
Cross-border supply chains in Ireland offer unique potential for greener logistics through shorter routes, shared infrastructure, and collaborative sustainability initiatives. ESG reporting alignment between NI and Ireland creates a competitive advantage for businesses that invest early.`,
          },
        ],
      },
      quizQuestions: {
        create: [
          {
            order: 1,
            question: 'In Lean thinking, value is defined from the perspective of the customer.',
            type: 'TRUE_FALSE',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'True',
          },
          {
            order: 2,
            question: 'Which of the following is one of the 8 categories of Lean waste?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify(['Innovation', 'Inventory', 'Inflation', 'Integration']),
            correctAnswer: 'Inventory',
          },
          {
            order: 3,
            question: 'What does a Value Stream Map help you identify?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify([
              'Employee performance ratings',
              'Value-adding and non-value-adding steps in a process',
              'Financial profit margins',
              'Supplier credit scores',
            ]),
            correctAnswer: 'Value-adding and non-value-adding steps in a process',
          },
          {
            order: 4,
            question: 'A "pull" system triggers production based on actual customer demand rather than forecasts.',
            type: 'TRUE_FALSE',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'True',
          },
          {
            order: 5,
            question: 'Which tool is most associated with visualising and managing workflow in a pull system?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify(['Gantt chart', 'Kanban board', 'SWOT analysis', 'Balance sheet']),
            correctAnswer: 'Kanban board',
          },
          {
            order: 6,
            question: 'What does ESG stand for?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify([
              'Energy, Supply, Governance',
              'Environmental, Social, Governance',
              'Efficiency, Sustainability, Growth',
              'Environmental, Systems, Guidelines',
            ]),
            correctAnswer: 'Environmental, Social, Governance',
          },
          {
            order: 7,
            question: 'Scope 3 emissions include the indirect emissions in a company\'s supply chain.',
            type: 'TRUE_FALSE',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'True',
          },
          {
            order: 8,
            question: 'Which reporting framework is mandatory for EU businesses under the Corporate Sustainability Reporting Directive?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify(['GRI', 'CDP', 'CSRD', 'ISO 9001']),
            correctAnswer: 'CSRD',
          },
          {
            order: 9,
            question: 'Kaizen refers to a one-time major transformation project in a supply chain.',
            type: 'TRUE_FALSE',
            options: JSON.stringify(['True', 'False']),
            correctAnswer: 'False',
          },
          {
            order: 10,
            question: 'Which of the following best supports a greener supply chain?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify([
              'Maximising shipment frequency for faster delivery',
              'Consolidating shipments to maximise vehicle fill rates',
              'Increasing packaging to reduce damage',
              'Sourcing exclusively from overseas suppliers',
            ]),
            correctAnswer: 'Consolidating shipments to maximise vehicle fill rates',
          },
        ],
      },
    },
  });

  await prisma.assignment.create({
    data: {
      courseId: course.id,
      scope: 'USER',
      userId: learner1.id,
      assignedById: admin.id,
    },
  });

  console.log(`Course created: ${course.title} (ID: ${course.id})`);
  console.log(`Assigned to: ${learner1.name} (${learner1.email})`);
}

main().finally(async () => prisma.$disconnect());
