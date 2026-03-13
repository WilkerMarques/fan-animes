# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run api:local`

Sobe a **API PHP local** (os mesmos arquivos de `hostgator/api/`) em [http://localhost:8080](http://localhost:8080).  
Requer PHP instalado. O React em desenvolvimento está configurado para enviar as chamadas `/api/*` para esse servidor (proxy).

**Como usar:**

1. **PHP instalado** – No Windows: [php.net/downloads](https://windows.php.net/download/) ou XAMPP.
2. **Banco de dados** (escolha uma):
   - **MySQL local** – Crie um banco (ex: `fan_animes_local`), importe o schema: `hostgator/api/schema-local.sql`. No `config.local.php` use `db_host` = `localhost`, `db_name`, `db_user` e `db_password` desse MySQL.
   - **Mesmo banco do servidor** – No `config.local.php` use as credenciais do HostGator (host remoto, usuário, senha, nome do banco). Os dados ficarão iguais ao da produção; use com cuidado para não misturar testes com produção.
3. **Config local** – Copie `hostgator/api/config.local.php.example` para `hostgator/api/config.local.php` e preencha: `db_*`, `dashboard_password` (senha do login do dashboard) e `cookie_secret` (qualquer string longa).
4. **Dois terminais:**
   - Terminal 1: `npm run api:local` (API em :8080)
   - Terminal 2: `npm start` (React em :3000)

Não defina `REACT_APP_API_URL` no `.env.local` ao usar a API local; o proxy já aponta para `http://localhost:8080`.  
Para usar a API do HostGator em produção enquanto desenvolve, crie `.env.local` com:  
`REACT_APP_API_URL=https://sua-url-hostgator`.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
