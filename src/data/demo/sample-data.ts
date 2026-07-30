export const barbers = [
  {
    id: "paulo",
    name: "Paulo",
    title: "Barbeiro",
    rating: 5,
    image: "/paulo.jfif",
  },
  {
    id: "felipe",
    name: "Felipe",
    title: "Barbeiro",
    rating: 5,
    image: "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&q=80",
  },
];

export const services = [
  { id: "s1", name: "Corte Degradê", duration: 45, price: 35, category: "Cabelo" },
  { id: "s2", name: "Barba", duration: 40, price: 20, category: "Barba" },
  { id: "s3", name: "Modelagem de Barba", duration: 30, price: 65, category: "Barba" },
  { id: "s4", name: "Toalha Quente", duration: 25, price: 55, category: "Tratamento" },
  { id: "s5", name: "Cabelo e Barba", duration: 90, price: 50, category: "Combo" },
  { id: "s6", name: "Corte Infantil", duration: 30, price: 25, category: "Cabelo" },
];

export const products = [
  { id: "p1", name: "Pomada Modeladora", stock: 24, price: 45, sold: 142 },
  { id: "p2", name: "Gel de Cabelo", stock: 18, price: 28, sold: 98 },
  { id: "p3", name: "Laquê", stock: 12, price: 35, sold: 67 },
];

export const appointments = [
  {
    id: "a1",
    time: "09:00",
    client: "Tiago Almeida",
    service: "Corte Signature",
    barber: "Lucas Moreau",
    status: "Confirmado",
    price: 120,
  },
  {
    id: "a2",
    time: "10:00",
    client: "Noah Bennett",
    service: "Barba Real",
    barber: "Adrian Cole",
    status: "Confirmado",
    price: 95,
  },
  {
    id: "a3",
    time: "11:30",
    client: "Ethan Park",
    service: "Modelagem de Barba",
    barber: "Marco Silva",
    status: "Pendente",
    price: 65,
  },
  {
    id: "a4",
    time: "13:00",
    client: "Rafael Costa",
    service: "Experiência Real",
    barber: "Lucas Moreau",
    status: "Confirmado",
    price: 280,
  },
  {
    id: "a5",
    time: "14:30",
    client: "Bruno Martins",
    service: "Corte Signature",
    barber: "Jordan Hayes",
    status: "Confirmado",
    price: 120,
  },
  {
    id: "a6",
    time: "16:00",
    client: "Henrique Souza",
    service: "Ritual Toalha Quente",
    barber: "Marco Silva",
    status: "Concluído",
    price: 55,
  },
  {
    id: "a7",
    time: "17:30",
    client: "Lucas Pereira",
    service: "Barba Real",
    barber: "Adrian Cole",
    status: "Confirmado",
    price: 95,
  },
];

export const employeePerf = barbers.map((b, i) => ({
  ...b,
  revenue: [0, 0][i],
  appts: [0, 0][i],
  commission: [0, 0][i],
}));
