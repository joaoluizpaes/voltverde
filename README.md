# Calculadora de Economia — Scooter Elétrica

Projeto estático em HTML, CSS e JavaScript. Não precisa de Node, banco de dados ou servidor para funcionar.

## Arquivos

- `index.html` — estrutura da calculadora
- `style.css` — visual responsivo
- `script.js` — cálculos, administração e compartilhamento

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie os três arquivos para a raiz do repositório.
3. Vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione `main` e `/ (root)`.
6. Salve.

## Administração

Senha inicial: `admin123`

A área administrativa é local nesta primeira versão: as alterações ficam no `localStorage` do navegador.

Isso é proposital para a primeira versão. Se a calculadora for usada por vários vendedores/computadores, o próximo passo recomendado é migrar as configurações para Supabase, com login de administrador.

## Fórmula principal

Scooter:

`custo de energia = km/mês × (Wh/km ÷ 1000) × R$/kWh`

Além da energia, entram manutenção, pneus/freios, reserva para bateria e custos fixos configurados.

Moto e carro:

`combustível = km/mês ÷ km/L × R$/L`

Além do combustível, entram manutenção, pneus/peças e custos fixos.

## Atenção aos valores

Os valores padrão são apenas referências iniciais para demonstração e devem ser revisados antes de colocar a calculadora em uso comercial. Tributos, licenciamento, seguro, depreciação e demais custos variam por veículo, categoria e legislação.

## Próxima evolução recomendada

Migrar o painel para Supabase para permitir:

- login de administrador;
- cadastro de vários modelos;
- edição dos valores em qualquer computador;
- histórico de alterações;
- ativar/desativar modelos;
- campos específicos por loja;
- atualização de tarifa de energia e combustível sem alterar o código.
