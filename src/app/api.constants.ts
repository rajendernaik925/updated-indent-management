export const projectName = 'Indent Management';

export const authUrls = {
  login: '/userlogin',
};

export const masterUrls = {
  division: '/master/userbu',
  plants: '/master/plants',
  materialTypes: '/master/material-types',
  materials: '/master/search/material',
  InitiatorStatus: '/master/indent/filter/status',
  status: '/master/filter/status',
};


export const commonUrls = {
  indentFiles: '/common/files',
  indentDetails: '/common/indentdetails',
  processIndent: (module: string) => `/${module}/process-indent`,
  materialUpdate: (module: string) => `/${module}/material-update`,
  removeMaterial: (module: string) => `/${module}/material-disable`,
  fileUpdate: (module: string) => `/${module}/file-update`,
}

export const commonListUrls = {
  raiseIndentRequest: '/initiator/raise-indent',
  indentRequestLIst: (module: string) => `/${module}/indents`,
}

export const dashboardUrls = {
  dashboardCounts: '/common/indentsummery',
}

