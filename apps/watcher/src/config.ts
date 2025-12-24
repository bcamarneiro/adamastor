export const DATASETS = [
	{
		name: "informacao_base",
		url: "https://app.parlamento.pt/webutils/docs/doc.txt?path=olg1f1%2frCt%2bfMmqQu7EYsANwHy3lTooaSVXeYPi7bnPPjKnOs0ec8jJKil69DrJmWU%2fXR8YYvbrgrWsMei9bJTiyEgfyaUWmCxFry303MX4SLs8vqHpbxFZnfMyN89LZnf1OpiYEqhds%2bd1orWsA8iSmHh6xNb8FnWz2BfhlFrX9CSN19YqSM70j85O4xwL1v%2fiOWXZI8kZa7B%2bva2DMgZwv0AHNbng6LeoWsN%2bh0bKTg8OGPB0JKAtU9k2VIhFzRH8NigB0Rr38yTkF%2bVX56xVZo9jdeIw4BtIWMFiQAEILErDBheI8aCaxLq9iPK%2bmNlU%2bWRJiE%2fONrjYWYpAaIz8r5eM3lM%2bJQg6XiJMEtY0g%2bZlbqiC1QMbfOdyQvGCv&fich=InformacaoBaseXVI_json.txt&Inline=true",
	},
	{
		name: "agenda",
		url: "https://app.parlamento.pt/webutils/docs/doc.txt?path=g25ZKRvxj7E%2bCuDT3BoxJKbdRNwmcYXtDyTuONx177jIzjV1iQEe7XWX%2b7%2fJUNBH44hpZdfF4HzOP16W6E0lR8eot3IlY7TgTVcWImO0oJgRev1hYgkUTv5d65p0xnT1CrxFg94PU28ExjUn%2fis5CM6y4exOfKkT2facldXDSymtw8B925QnPFu3bGHaUy3tNBWgcuBTKioEyw1AGDmt2RGPiQL0IkviQhm89hMl8Giho6fBjqvYCNJUtOrViFRa7JANbUzfcTwv3wQMaXqgEJXPmJpXXNrehBlmZz%2fgsK7xX93pnvh5Hd%2f6vTFp8fiFqY6rFXSHedRs7x0%2blGrZVyCL5GHNzr0kx9%2fTn7HuAn5LRjPAHZzIn32e70j2ejDTmluroJqE%2bPSjuMirn%2bWOOw%3d%3d&fich=AgendaParlamentar_json.txt&Inline=true",
	},
	{
		name: "atividades",
		url: "https://app.parlamento.pt/webutils/docs/doc.txt?path=pKgqcXYRTmZUKtkIRuj%2boKoP6a%2fq2xHbk5Zhh%2bkzHcpBv1Gaj28wfhimJLlOpTfIUu1enBHODqQklaJ%2fKA4EmG5e7alPCdljjSNizx6xs3FZgxcnNIUfDA8hrHVMUVk5Q5b6X5%2bIyST8iq6CE3nkqiEXqttN8e%2bOitG8tShegV60ZZGsJ5Ad3LlZ%2fhwLm5HAH36g%2b87ZmXMcjZGRg7XP%2f9ocs2S4c8iDJwoOq9IhIb5bwkbYx%2fACZsMoHjW2%2bEibkSjaK%2bec6%2bPOgc%2bb4K9Y%2fEyspTn2zB%2fX0yIj0I%2bsRRNppTfmCWp7sh2bHmf0VG2DQL31bMA9oCf9bM4KlYYNJhvDVuy%2bdNfPN2Ju72vB3CY%3d&fich=AtividadesXVI_json.txt&Inline=true",
	},
	{
		name: "iniciativas",
		url: "https://app.parlamento.pt/webutils/docs/doc.txt?path=W2OionzM%2fXDmzTuw2%2bc7LOUJgVqUKbhH0K%2fn4Ar89VxjaLXEY0mUVBtetd5W%2bFL9TRZkOmLBb3ny5Lx1iwEGddC0KTDFDZcUZIUUhAmO2UET1Tu3LaCNBJPH7%2f%2b1%2bB4s4IKwVi4Ym5w4BA%2bpo8%2fIBKQR8Y8cPCiN94w7nKDnZs%2fy1fEDCyZw%2bruDbvr8Y%2bZngg8%2f7RMlF8808vDAp%2bM6FVUDxoqeUdnC%2bT0AGqGOzsPT8JatKvswhxEUDmMyDei1q8OoB5t4vLEaWuZ6OMM0xOeqXAXIVyybZbGMGxxAL5%2bysxddhq04jhIf7gzyd4nCuhIyymlUkpsfiMlA%2bwRmjunbQWeyzKmcJCYIku7jh9U%3d&fich=IniciativasXVI_json.txt&Inline=true",
	},
];

export const SNAPSHOT_PATH = "snapshots"; // local cache dir
export const BUCKET = process.env.B2_BUCKET;
export const POLITENESS_UA = "parl-watch-bot (+your@email)";
