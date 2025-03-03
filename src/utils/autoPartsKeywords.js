const suggests = ["pastilha de freio", "pastilhas", "past. freio", "disco de freio", "disco", "fluido de freio",
  "amortecedor", "amort.", "mola", "molas", "coifa", "batente","bucha", "pivô", "bieleta", "correia dentada", "tensor", "vela de ignição", "bobina de ignição", "bomba de óleo", "cárter",
  "embreagem", "kit de embreagem", "cabo de embreagem", "eixo homocinético", "semi-eixo",
  "radiador", "ventoinha", "bomba d'água", "mangueira do radiador", "válvula termostática",
  "bateria", "alternador", "motor de partida", "velas", "bobina", "fusível", "relé",
  "caixa de direção", "barra de direção", "ponta de eixo", "bomba hidráulica", "fluido de direção",
  "pneu", "pneus", "calota", "aro", "câmara de ar", "estepe", "válvula de ar","para-lama", "paralama", "para-barro", "capô", "parachoque", "porta-malas", "retrovisor",
  "catalisador", "silencioso", "tubo de escape", "coletor de escape", "flexível de escapamento"
]

const purchaseKeywords = ["preço", "valor", "quanto", "compra", "orçamento"]

const modelsCars = [
  // Chevrolet
  "Agile", "Astra", "Blazer", "Celta", "Classic", "Cobalt", "Cruze", "Equinox", "Kadett", "Malibu", "Corsa",
  "Meriva", "Montana", "Onix", "Onix Plus", "Prisma", "S10", "Silverado", "Spin", "Tracker", "Trailblazer", "Vectra", "Zafira", 

  // Volkswagen
  "Amarok", "Bora", "CrossFox", "Fox", "Fusca", "Gol", "Golf", "Jetta", "Kombi", "Nivus", 
  "Parati", "Passat", "Polo", "Saveiro", "SpaceFox", "T-Cross", "Tiguan", "Touareg", "Up", "Virtus", "Voyage",

  // Fiat
  "Argo", "Bravo", "Cronos", "Doblo", "Fastback", "Fiorino", "Grand Siena", "Idea", "Marea", "Mobi", 
  "Palio", "Punto", "Siena", "Strada", "Toro", "Uno", "Pulse",

  // Ford
  "Bronco", "Courier", "EcoSport", "Edge", "Escort", "Explorer", "F-1000", "F-250", "F-4000", "Fiesta",
  "Focus", "Fusion", "Ka", "Maverick", "Mustang", "Ranger", "Territory", "Versailles",

  // Toyota
  "Bandeirante", "Camry", "Corolla", "Corolla Cross", "Etios", "Hilux", "Prius", "RAV4", "Supra", "SW4", "Yaris",

  // Honda
  "Accord", "Civic", "City", "CR-V", "Fit", "HR-V", "WR-V", "Hrv", "Wrv",

  // Nissan
  "Frontier", "Kicks", "March", "Sentra", "Versa", "X-Trail",

  // Renault
  "Captur", "Clio", "Duster", "Fluence", "Kwid", "Logan", "Megane", "Sandero", "Scenic", "Symbol",

  // Peugeot
  "206", "207", "208", "3008", "307", "308", "408", "5008",

  // Citroën
  "Aircross", "C3", "C4", "C4 Cactus", "C5", "Jumpy",

  // Hyundai
  "Azera", "Creta", "Elantra", "HB20", "HB20S", "i30", "Santa Fe", "Tucson", "Veloster",

  // Jeep
  "Cherokee", "Commander", "Compass", "Grand Cherokee", "Renegade", "Wrangler",

  // Mitsubishi
  "ASX", "Eclipse Cross", "L200", "Outlander", "Pajero",

  // Mercedes-Benz
  "A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE",

  // BMW
  "X1", "X3", "X5", "Serie 1", "Serie 3", "Serie 5",

  // Audi
  "A3", "A4", "A5", "Q3", "Q5", "Q7",

  // Outras marcas
  "Tiggo", "QQ", "J3", "T40", "Lexus NX", "Lexus RX", "Discovery", "Evoque", 
  "Subaru Forester", "Suzuki Jimny", "XC40", "C60"
];

function captureVehicle(mensagem) {
  const regexModelos = new RegExp(`\\b(${modelsCars.join("|")})\\b`, "i");
  const regexAno = /\b(20\d{2}|\d{2})\b/;
  const regexMotor = /\b(\d+\.\d+L?|\d+L)\b/;

  const modeloMatch = mensagem.match(regexModelos);
  const anoMatch = mensagem.match(regexAno);
  const motorMatch = mensagem.match(regexMotor);

  let ano = anoMatch ? anoMatch[1] : null;

  if (ano && ano.length === 2) {
    const anoNumero = parseInt(ano, 10);
    ano = anoNumero >= 50 ? `19${ano}` : `20${ano}`;
  }

  return {
    modelo: modeloMatch ? modeloMatch[1] : null,
    ano: ano,
    motor: motorMatch ? motorMatch[1] : null
  };
}

module.exports = {
  captureVehicle,
  suggests,
  purchaseKeywords
};
