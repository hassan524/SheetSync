const realData: any = [
  
];

const emptyRow = {
  "Job Request": "",
  Submitted: "",
  Status: "",
  Submitter: "",
  URL: "",
  Assigned: "",
  Priority: "",
  "Due Date": "",
  "Ext. Value": "",
};

const data = [...realData];
while (data.length < 20) {
  data.push({ ...emptyRow });
}

export { data };
