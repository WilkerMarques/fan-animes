# Erro 500: Permission denied em `.git/.htaccess`

Se o log do Apache mostrar:

```text
AH00529: .../public_html/.git/.htaccess pcfg_openfile: unable to check htaccess file,
ensure it is readable and that '.../public_html/.git/' is executable
```

é porque o repositório Git foi clonado dentro de `public_html` e o Apache não tem permissão para acessar a pasta `.git`.

## Solução no cPanel

1. Abra **File Manager** e vá até **public_html**.
2. Ative **Settings** (ou **Preferências**) e marque **Show Hidden Files**.
3. Localize a pasta **.git** dentro de `public_html`.
4. Clique com o botão direito em **.git** → **Change Permissions**.
5. Defina **755** (ou marque: Owner Read+Write+Execute, Group Read+Execute, World Read+Execute).
6. Marque **Recurse into subdirectories** (se existir) e confirme.

Se ainda der erro, verifique se existe o arquivo **.git/.htaccess**. Se existir, ajuste a permissão dele para **644**.

Depois disso, o 500 causado por esse erro deve parar. O `.htaccess` na raiz do site (incluído no deploy) bloqueia acesso web à pasta `.git` por segurança.
