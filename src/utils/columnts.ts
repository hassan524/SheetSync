
const letters = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i)
);

const columns: any[] = [
  {
    header: "#",
    id: "rowIndex",
    cell: ({ row }) => row.index + 1, 
    background: "#FFFFFF",
  },
  ...letters.map((letter) => ({
    header: letter,
    id: letter,        
    cell: () => null,
    background: "#FFFFFF",
  })),
];

export default columns;
