export interface College {
  id: string;
  name: string;
  tier: string;
  specialization: string;
  tuitionSticker: number;
  avgAidPackage: number;
  deadlineED: string;
  deadlineRD: string;
  location: string;
  acceptanceRate: number;
}

export const collegesData: College[] = [
  {
    id: "col-harvard",
    name: "Harvard University",
    tier: "Ivy League",
    specialization: "General",
    tuitionSticker: 82500,
    avgAidPackage: 64700,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 01",
    location: "Cambridge, MA",
    acceptanceRate: 4
  },
  {
    id: "col-yale",
    name: "Yale University",
    tier: "Ivy League",
    specialization: "Humanities",
    tuitionSticker: 83800,
    avgAidPackage: 61500,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 02",
    location: "New Haven, CT",
    acceptanceRate: 5
  },
  {
    id: "col-princeton",
    name: "Princeton University",
    tier: "Ivy League",
    specialization: "General",
    tuitionSticker: 82900,
    avgAidPackage: 62400,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 01",
    location: "Princeton, NJ",
    acceptanceRate: 6
  },
  {
    id: "col-columbia",
    name: "Columbia University",
    tier: "Ivy League",
    specialization: "Humanities",
    tuitionSticker: 85200,
    avgAidPackage: 59800,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 01",
    location: "New York, NY",
    acceptanceRate: 4
  },
  {
    id: "col-mit",
    name: "Massachusetts Institute of Technology (MIT)",
    tier: "Top Engineering",
    specialization: "Engineering",
    tuitionSticker: 80500,
    avgAidPackage: 58900,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 05",
    location: "Cambridge, MA",
    acceptanceRate: 4
  },
  {
    id: "col-caltech",
    name: "California Institute of Technology (Caltech)",
    tier: "Top Engineering",
    specialization: "Engineering",
    tuitionSticker: 81200,
    avgAidPackage: 54800,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 03",
    location: "Pasadena, CA",
    acceptanceRate: 3
  },
  {
    id: "col-jhu",
    name: "Johns Hopkins University",
    tier: "Specialized Health",
    specialization: "Health",
    tuitionSticker: 81900,
    avgAidPackage: 53500,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 08",
    location: "Baltimore, MD",
    acceptanceRate: 7
  },
  {
    id: "col-stanford",
    name: "Stanford University",
    tier: "Top Engineering",
    specialization: "Engineering",
    tuitionSticker: 82400,
    avgAidPackage: 58200,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 05",
    location: "Stanford, CA",
    acceptanceRate: 4
  },
  {
    id: "col-berkeley",
    name: "University of California, Berkeley",
    tier: "Top Public",
    specialization: "Engineering",
    tuitionSticker: 46500,
    avgAidPackage: 17200,
    deadlineED: "None",
    deadlineRD: "Nov 30",
    location: "Berkeley, CA",
    acceptanceRate: 11
  },
  {
    id: "col-williams",
    name: "Williams College",
    tier: "Top Liberal Arts",
    specialization: "Arts",
    tuitionSticker: 79200,
    avgAidPackage: 52400,
    deadlineED: "Nov 15",
    deadlineRD: "Jan 05",
    location: "Williamstown, MA",
    acceptanceRate: 8
  },
  {
    id: "col-gatech",
    name: "Georgia Institute of Technology",
    tier: "Top Public",
    specialization: "Engineering",
    tuitionSticker: 34800,
    avgAidPackage: 11500,
    deadlineED: "Oct 15",
    deadlineRD: "Jan 05",
    location: "Atlanta, GA",
    acceptanceRate: 16
  },
  {
    id: "col-wharton",
    name: "University of Pennsylvania (Wharton)",
    tier: "Ivy League",
    specialization: "Business",
    tuitionSticker: 84600,
    avgAidPackage: 57500,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 05",
    location: "Philadelphia, PA",
    acceptanceRate: 6
  },
  {
    id: "col-umich",
    name: "University of Michigan",
    tier: "Top Public",
    specialization: "Business",
    tuitionSticker: 57200,
    avgAidPackage: 19500,
    deadlineED: "Nov 01",
    deadlineRD: "Feb 01",
    location: "Ann Arbor, MI",
    acceptanceRate: 18
  },
  {
    id: "col-georgetown",
    name: "Georgetown University",
    tier: "Top Public",
    specialization: "Business",
    tuitionSticker: 81500,
    avgAidPackage: 47200,
    deadlineED: "Nov 01",
    deadlineRD: "Jan 10",
    location: "Washington, DC",
    acceptanceRate: 12
  }
];
