/* Zuper Roofing Academy: proposed content updates from docs.zuper.co, for staff review.
   Loaded only when a staff member opens the Content review page (#review).
   Each source is [title, url]. In options arrays, `a` is the index of the correct answer. */
(function () {
  "use strict";
  var D = "https://docs.zuper.co/";
  var S = {
    roof: ["Zuper for Roofing", D + "Zuper_for_Roofing/Overview_Roof"],
    trial: ["Roofing trial walkthrough", D + "Getting_Started/zuper-roofing-trial"],
    users: ["Managing users", D + "Settings/Users_Teams/Users_Creation"],
    usersGen: ["User & team settings", D + "Settings/Users_Teams/General"],
    usersStart: ["Add users and teams", D + "Getting_Started/Users_Teams"],
    mobile: ["Mobile quickstart", D + "Zuper_Mobile_Apps/Quickstart-guide-for-FE"],
    client: ["Client overview", D + "Client/Overview"],
    dispatch: ["Dispatch overview", D + "Dispatch/Overview"],
    queue: ["Dispatcher Queue", D + "Dispatch/Deep_dive_into_dispatcher_queue"],
    invoices: ["Managing invoices", D + "Accounting/Invoices/Managing_invoices"],
    newInvoice: ["Create an invoice", D + "Accounting/Invoices/Create_new_invoice"],
    measure: ["Configuring measurements", D + "Settings/Modules/Jobs/Configuring_Measurements"],
    cpqTpl: ["Proposal template with CPQ", D + "Zuper_for_Roofing/Proposal_Template_with_CPQ"],
    cpq: ["How Zuper CPQ works", D + "Zuper_for_Roofing/CPQ_works"],
    split: ["Split a measurement", D + "Zuper_for_Roofing/measurements/split-a-measurement"],
    wb: ["Workflow Builder overview", D + "Workflow_builder/Workflow_overview"],
    hover: ["Hover integration", D + "Integrations/Measurements_and_estimations/Zuper_Hover"],
    eagle: ["EagleView integration", D + "Integrations/Measurements_and_estimations/EagleView"],
    qbo: ["QuickBooks Online setup", D + "Integrations/Accounting_and_payments/Zuper_QuickBooks_Online"],
    jobDetail: ["Managing job details", D + "Work_Order_Management/Job-detail-page"],
    jobs: ["Overview of jobs", D + "Work_Order_Management/Jobs/Overview_of_jobs"],
    newJob: ["Create a job", D + "Work_Order_Management/Jobs/creating_a_new_job"],
    reports: ["Reports overview", D + "Reports/Overview"],
    pvq: ["Proposals vs quotes", D + "Accounting/Difference_Between_Proposals_and_Quotes"],
    quotes: ["Managing quotes", D + "Accounting/Managing_Quotes"],
    proposal: ["Create a proposal", D + "Accounting/Proposal"],
    pay: ["Zuper Pay setup", D + "Zuper-pay/Settings"],
    signin: ["Install and sign in", D + "Getting_Started/Installing_Zuper"],
    assisted: ["Assisted Scheduling", D + "Work_Order_Management/Jobs/Assisted_Scheduling"],
    index: ["Docs index (widget pages listed, not read in full)", D + "llms.txt"]
  };

  window.ACADEMY_REVIEW = {
    asOf: "16 Nov 2026",
    intro: "Every change planned for the Academy from docs.zuper.co. Nothing here is in the lessons yet. Tell Claude what to change, drop or reword; once you approve, it gets built, previewed and deployed with your go-ahead.",
    decided: ["All four areas (A–D) go in", "Invoices: teach both routes", "Workflow Builder stays the main automation tool, with a beta note"],

    corrections: [
      { id: "A1", where: "Part 5 automation card · Reference › Automations", now: "Workflow Builder: a trigger, then actions", next: "Same, plus: “Workflow Builder is in Private Beta; it’s switched on for an account through Zuper support (support@zuper.co), so request it early.”", src: [S.wb] },
      { id: "A2", where: "Part 4 left-menu card “Reports”", now: "Report builder, dashboards, Zuper Sense", next: "Legacy Reports (all plans), Report Builder (paid add-on, beta), Zuper Sense", src: [S.reports] },
      { id: "A3", where: "Part 5 Revenue, step 1 and narration", now: "Convert to invoice: Accounting › Quotes › More Actions", next: "Step: “Invoice the quote: from the quote, or from the job / Accounting › Invoices › + New Invoice, linking the quote”. Narration adds: “The proposal becomes a quote when the homeowner signs or someone marks it Accepted.”", src: [S.pvq, S.quotes, S.newInvoice] },
      { id: "A4", where: "Part 5 inspection narration", now: "No plan note on measurements", next: "Add: “Hover and EagleView integrations need a Zuper Core or Premium plan.”", src: [S.hover, S.eagle] },
      { id: "A5", where: "Part 4 paths · Reference cheat sheet", now: "Zuper IQ", next: "Zuper IQ – Intelligent Quoting", src: [S.cpqTpl] }
    ],

    partQs: [
      { id: "B1", part: "Part 2 · Lifecycle", q: "In the docs’ Zuper for Roofing flow, what comes right after the proposal?", o: ["Create invoice", "Create material request", "Create inspection", "Roof service tasks"], a: 1, e: "The six steps: inspection, proposal, material request, installation job, roof service tasks, invoice.", src: [S.roof] },
      { id: "B2", part: "Part 2 · Lifecycle", q: "In Zuper’s roofing trial setup, saving a new customer automatically creates…", o: ["An invoice", "A Lead Qualification job", "A proposal", "A purchase order"], a: 1, e: "That job starts Lead Intake: the rep qualifies the lead before an inspection is booked.", src: [S.trial] },
      { id: "B3", part: "Part 3 · Basics", q: "Which three roles do the Zuper docs name as standard?", o: ["Admin, Team Leader, Field Executive", "Owner, Manager, Crew", "Admin, Dispatcher, Customer", "Super Admin, Sales, Installer"], a: 0, e: "Custom roles can be added; a user holds one role at a time.", src: [S.users] },
      { id: "B4", part: "Part 3 · Basics", q: "A technician loses signal on a rural job. What does the mobile app still have?", o: ["Everything in the account", "Assigned jobs for about 3 days either side, with customers, properties and parts, but not quotes or invoices", "Only today’s job", "Nothing"], a: 1, e: "Offline mode must be on. Accepting new job assignments needs a connection.", src: [S.mobile] },
      { id: "B5", part: "Part 3 · Basics", q: "How many organizations can one property be linked to at a time?", o: ["One", "Two", "Up to ten", "Unlimited"], a: 0, e: "To move it, open the property and edit the organization.", src: [S.client] },
      { id: "B6", part: "Part 4 · Where", q: "Which four layouts does the Dispatch Board have?", o: ["Dispatcher Queue, Users, Scheduler, Map", "Day, Week, Month, Year", "Kanban, List, Calendar, Map", "Jobs, Routes, Teams, Assets"], a: 0, e: "The Dispatcher Queue lists unscheduled, assigned, unassigned and overdue jobs.", src: [S.dispatch] },
      { id: "B7", part: "Part 4 · Where", q: "The office deleted an invoice by mistake. Can it come back?", o: ["No, deletes are permanent", "Yes, within 90 days from Settings › Data Administration › Recovery", "Only through QuickBooks Online", "Only if it was paid"], a: 1, e: "A cancelled invoice can’t be restored, so delete and cancel are not the same.", src: [S.invoices] },
      { id: "B8", part: "Part 4 · Where", q: "Where are measurement providers and tokens set up?", o: ["Job settings › Measurements (Providers, Tokens)", "Accounting › Quotes", "Settings › Developer Hub", "Dispatch Board › Settings"], a: 0, e: "Tokens like Total Roof Area (SQFT) feed CPQ formulas.", src: [S.measure] },
      { id: "B9", part: "Part 5 · Workflow", q: "What decides when a published CPQ template builds a proposal automatically?", o: ["The job’s category and status", "The rep’s name", "The customer’s zip code", "The time of day"], a: 0, e: "Each template sets its Job Category and Job Status triggers, e.g. Ready for Estimate.", src: [S.cpqTpl] },
      { id: "B10", part: "Part 5 · Workflow", q: "Which generic presets can a new CPQ template start from?", o: ["Good / Better / Best, Option 1 / 2 / 3, or Single Option", "Bronze / Silver / Gold only", "Small / Medium / Large", "There are none"], a: 0, e: "There are also industry presets for Owens Corning, GAF and CertainTeed, or Start from Scratch.", src: [S.cpqTpl] },
      { id: "B11", part: "Part 5 · Workflow", q: "Shingles on the main roof, metal on the porch. How do you price both from one report?", o: ["Order a second report", "Split the measurement (up to 4 splits; areas and lengths divided, waste % entered per split)", "Edit tokens by hand", "Create a second job"], a: 1, e: "The original must be Completed and not itself a split.", src: [S.split] },
      { id: "B12", part: "Part 5 · Workflow", q: "A client wants Workflow Builder automations. What should you know first?", o: ["It’s on every account by default", "It’s in Private Beta and is switched on through Zuper support", "It only works with QuickBooks", "It replaces job statuses"], a: 1, e: "Request it early so it’s ready for the automation workshop.", src: [S.wb] },
      { id: "B13", part: "Part 6 · Implement", q: "A client wants Hover measurements in Zuper. What do you check?", o: ["Nothing, it works everywhere", "That they’re on a Zuper Core or Premium plan", "That they use QuickBooks Online", "That reps use iPhones"], a: 1, e: "EagleView has the same plan requirement.", src: [S.hover] },
      { id: "B14", part: "Part 6 · Implement", q: "The client wants inventory to sync both ways with QuickBooks Online. What do you confirm at kickoff?", o: ["Nothing, it always works", "That they’re on QuickBooks Online Plus or Advanced", "That they use QuickBooks Desktop", "That Zuper Pay is on"], a: 1, e: "Class tracking needs Plus or Advanced too.", src: [S.qbo] }
    ],

    caseQs: [
      { id: "C1", part: "Lakeside Exteriors", q: "Lakeside’s reps sell GAF shingles. What’s the quickest start for their CPQ template?", o: ["Start from scratch", "The GAF industry preset, then adjust products and prices", "Copy a JobNimbus estimate", "A standard fixed-price template"], a: 1, e: "Industry presets exist for Owens Corning, GAF and CertainTeed.", src: [S.cpqTpl] },
      { id: "C2", part: "Lakeside Exteriors", q: "Dana wants Hover measurements to feed proposals. What do you confirm first?", o: ["That Lakeside is on Zuper Core or Premium, and a Hover admin can approve the connection", "That reps have iPhones", "That QuickBooks Desktop is connected", "Nothing"], a: 0, e: "A Zuper admin installs Hover from the App Store; a Hover admin must authorise it.", src: [S.hover] },
      { id: "C3", part: "Ironclad Storm Restoration", q: "A rep orders an EagleView report for a hail claim. What can they add to the order?", o: ["Nothing extra", "Claim details: claim number, claim information, PO number, date of loss and CAT ID", "The homeowner’s bank details", "The supplement amount"], a: 1, e: "EagleView also needs a valid card on file before any order.", src: [S.eagle] },
      { id: "C4", part: "Ironclad Storm Restoration", q: "The adjuster wants photos of the damage. Fastest way in Zuper?", o: ["Email photos one by one", "Select the photos in the job gallery and Create Photo Report", "Export the job to PDF", "Share the rep’s phone gallery"], a: 1, e: "A photo report can start from scratch or from a template.", src: [S.jobDetail] },
      { id: "C5", part: "Summit Ridge Roofing", q: "Summit Ridge wants website visitors to get a ballpark price and book on the spot. What fits?", o: ["A Zuper website widget such as Instant Estimate or Estimate and Book", "A HubSpot form only", "A QuickBooks invoice link", "A Zuper Connect call queue"], a: 0, e: "Zuper for Roofing also has Lead Capture and Online Booking widgets.", src: [S.index] },
      { id: "C6", part: "Summit Ridge Roofing", q: "You’ll build their drips in Workflow Builder. What do you do in week one?", o: ["Nothing special", "Ask Zuper support to switch Workflow Builder on (it’s in Private Beta)", "Buy a separate SMS tool", "Build them in QuickBooks"], a: 1, e: "Start 10DLC registration the same week.", src: [S.wb] },
      { id: "C7", part: "Northgate Roofing", q: "The office manager can’t mark a job Completed. Most likely cause?", o: ["The invoice is unpaid", "Service tasks on the job are still open", "The proposal expired", "The crew is offline"], a: 1, e: "Each task must be Completed, Canceled or Incomplete, unless “Allow managing tasks in completed jobs” is on.", src: [S.jobDetail] },
      { id: "C8", part: "Northgate Roofing", q: "Hover shows a report as complete, but Zuper still says Pending. What do you do?", o: ["Order a new report", "Use “Sync from Hover” on the measurement card", "Delete the job", "Wait a week"], a: 1, e: "Removing a measurement in Zuper only unlinks it from Hover.", src: [S.hover] },
      { id: "C9", part: "Northgate Roofing", q: "A crew lead working offline can’t open the job’s quote. Why?", o: ["A bug", "Quotes and invoices aren’t saved for offline use", "The quote was deleted", "Wrong role"], a: 1, e: "Job details, customers, properties and parts are available offline; quotes and invoices need a connection.", src: [S.mobile] }
    ],

    settings: [
      ["Users", "Settings › Users & Teams › User Management", S.usersStart],
      ["Teams (incl. Non-Dispatchable)", "Settings › Users & Teams › Team Management", S.usersGen],
      ["Custom roles and permissions", "Settings › Modules › Users and Teams › Custom Roles", S.usersGen],
      ["Measurement providers and tokens", "Job settings › Measurements › Providers / Tokens", S.measure],
      ["Job document templates (e-sign)", "Settings › Modules › Jobs › Document Templates", S.jobDetail],
      ["Job reminders and alerts", "Settings › Modules › Jobs › Job Notifications", S.jobs],
      ["Zuper Pay", "Settings › Zuper Pay", S.pay],
      ["Restore deleted records", "Settings › Data Administration › Recovery", S.invoices],
      ["Hover, EagleView, QuickBooks Online", "App Store (profile menu) › pick the app › Install / Connect", S.hover]
    ],
    settingsNote: "Also: the CPQ rows say “Zuper IQ – Intelligent Quoting”, and the Automations row adds “Workflow Builder is Private Beta; enabled through Zuper support”.",

    limits: [
      ["Secondary contacts per job", "Up to 10", S.newJob],
      ["Documents per job · document templates", "50 · 100", S.jobDetail],
      ["Unsigned job documents", "Reminder after 3 days; expire after 30 days", S.jobDetail],
      ["Co-signers on a proposal", "Up to 3, plus the primary signer", S.proposal],
      ["Splits per measurement", "Up to 4", S.split],
      ["Offline mode on mobile", "Assigned jobs about 3 days either side", S.mobile],
      ["Attachments per mobile note", "5, up to 20 MB each", S.mobile],
      ["Invoice email attachments", "20 MB combined, then download links", S.invoices],
      ["Restoring a deleted invoice", "Within 90 days", S.invoices],
      ["Wrong passwords at sign-in", "3 attempts, then the network IP is blocked for 30 minutes", S.signin],
      ["Assisted Scheduling job length", "Up to 8 hours", S.assisted]
    ],

    glossary: [
      ["Proposal vs quote", "A proposal offers options; once the customer signs or it’s marked Accepted, it becomes a quote, the agreed price.", S.pvq],
      ["Token", "A named measurement value, like Total Roof Area (SQFT), that CPQ formulas use with an @, e.g. @Roof_Area.", S.measure],
      ["Split measurement", "One completed measurement divided into up to four parts, e.g. shingle roof and metal porch.", S.split],
      ["Service package", "A reusable set of items that becomes one option in a proposal.", S.proposal],
      ["Dispatcher Queue", "The Dispatch Board list of unscheduled, assigned, unassigned and overdue jobs to place.", S.queue],
      ["Child job", "A job under a parent job; we use one job with many appointments instead.", S.jobs]
    ],

    resources: [
      ["next.zuperpro.com", "The Zuper web app; enter the company name, then email and password.", "https://next.zuperpro.com"],
      ["Zuper for Roofing overview", "The roofing solution end to end", S.roof[1]],
      ["How Zuper CPQ works", "Configure, price, quote", S.cpq[1]],
      ["Zuper for Roofing trial walkthrough", "Lead to paid invoice in the trial account", S.trial[1]],
      ["Proposals vs quotes", "When a proposal becomes a quote", S.pvq[1]]
    ],
    resourcesNote: "The existing Resources entries (docs, release notes, developer portal) also become clickable links.",

    keep: "Our own practices stay as they are; the docs don’t contradict them: QuickBooks Online only, one job with many appointments, the migration approach, 10DLC on day one, drips as custom workflows, and margin or markup.",
    open: [
      ["Insurance category name", "The docs’ roofing trial calls it “Claim”; the course says “Insurance Replacement”. Keep ours unless you say otherwise."],
      ["C5 website widgets", "Only the docs index lists these pages (Instant Estimate, Estimate and Book, Lead Capture, Online Booking); they weren’t read in full. Keep, or drop C5?"],
      ["Settings paths", "The docs give two slightly different paths in a few places (Custom Roles, API keys, timelog settings). The most specific one is used; the Reference page already says paths can move between releases."],
      ["Scores", "Each part’s score total grows (e.g. Part 5 goes from 6 to 10 questions). Almost no one has used the live site, so nobody loses progress that matters."]
    ]
  };
})();
