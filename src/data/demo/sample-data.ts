export const barbers = [
  {
    id: "1",
    name: "Lucas Moreau",
    title: "Barbeiro Master",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80",
  },
  {
    id: "2",
    name: "Adrian Cole",
    title: "Estilista Sênior",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80",
  },
  {
    id: "3",
    name: "Marco Silva",
    title: "Especialista em Barba",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?w=400&q=80",
  },
  {
    id: "4",
    name: "Jordan Hayes",
    title: "Barbeiro Júnior",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80",
  },
];

export const services = [
  { id: "s1", name: "Corte Signature", duration: 45, price: 120, category: "Cabelo" },
  { id: "s2", name: "Barba Real", duration: 40, price: 95, category: "Barba" },
  { id: "s3", name: "Modelagem de Barba", duration: 30, price: 65, category: "Barba" },
  { id: "s4", name: "Ritual Toalha Quente", duration: 25, price: 55, category: "Tratamento" },
  { id: "s5", name: "Experiência Real", duration: 90, price: 280, category: "Premium" },
  { id: "s6", name: "Corte Infantil", duration: 30, price: 55, category: "Cabelo" },
];

export const products = [
  { id: "p1", name: "Pomada King's", stock: 24, price: 78, sold: 142 },
  { id: "p2", name: "Óleo de Barba — Âmbar", stock: 12, price: 64, sold: 98 },
  { id: "p3", name: "Spray Sal Marinho", stock: 8, price: 52, sold: 67 },
  { id: "p4", name: "Loção Pós-Barba Cedro", stock: 18, price: 88, sold: 53 },
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
  revenue: [19680, 16240, 15120, 10480][i],
  appts: [142, 128, 119, 86][i],
  commission: [5904, 4872, 4536, 3144][i],
}));
