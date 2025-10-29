# Exemplos de Arquivos YAML Gerados com Comentários

Todos os arquivos YAML gerados pelo Traefik Manager agora incluem um comentário na primeira linha indicando qual template foi usado para gerá-los.

## SSL Termination - HTTPS Básico

```yaml
# Generated using template: ssl-termination-https.yml
http:
  routers:
    apache1-http:
      rule: Host(`apache1.teste.techify.run`)
      service: apache1-service
      entryPoints: [web]
      middlewares: [redirect-to-https]
    apache1-https:
      rule: Host(`apache1.teste.techify.run`)
      service: apache1-service
      entryPoints: [websecure]
      tls:
        certResolver: letsencrypt
  services:
    apache1-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.101:80
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
```

## SSL Termination - HTTPS com Path Redirect

```yaml
# Generated using template: ssl-termination-https-with-path.yml
http:
  routers:
    proxy-http:
      rule: Host(`proxy.teste.techify.run`)
      service: proxy-service
      entryPoints: [web]
      middlewares: [redirect-to-https]
    proxy-https:
      rule: Host(`proxy.teste.techify.run`)
      service: proxy-service
      entryPoints: [websecure]
      middlewares: [proxy/rx-root]
      tls:
        certResolver: letsencrypt
  services:
    proxy-service:
      loadBalancer:
        servers:
          - url: http://10.50.50.50:64780
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    proxy/rx-root:
      replacePathRegex:
        regex: '^(?:/(.*))?$'
        replacement: /traefik-manager/${1}
```

## SSL Termination - HTTPS com Path Prefix

```yaml
# Generated using template: ssl-termination-https-with-prefix.yml
http:
  routers:
    app-http:
      rule: Host(`app.teste.techify.run`)
      service: app-service
      entryPoints: [web]
      middlewares: [redirect-to-https]
    app-https:
      rule: Host(`app.teste.techify.run`)
      service: app-service
      entryPoints: [websecure]
      tls:
        certResolver: letsencrypt
    app-https-api:
      rule: Host(`app.teste.techify.run`) && PathPrefix(`/api`)
      service: app-service
      entryPoints: [websecure]
      middlewares: [app/rx-api]
      priority: 1000
      tls:
        certResolver: letsencrypt
  services:
    app-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.100:80
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
    app/rx-api:
      replacePathRegex:
        regex: '^/api(?:/(.*))?$'
        replacement: /v1/api/${1}
```

## SSL Termination - HTTP Only

```yaml
# Generated using template: ssl-termination-http-only.yml
http:
  routers:
    http-only-http:
      rule: Host(`http.teste.techify.run`)
      service: http-only-service
      entryPoints: [web]
  services:
    http-only-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.102:80
```

## SSL Termination - Wildcard

```yaml
# Generated using template: ssl-termination-https.yml
http:
  routers:
    wildcard-http:
      rule: HostRegexp(`^.*.teste.techify.run$`)
      service: wildcard-service
      entryPoints: [web]
      middlewares: [redirect-to-https]
    wildcard-https:
      rule: HostRegexp(`^.*.teste.techify.run$`)
      service: wildcard-service
      entryPoints: [websecure]
      tls:
        certResolver: letsencrypt
  services:
    wildcard-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.103:80
  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true
```

## SSL Passthrough - HTTPS

```yaml
# Generated using template: passthrough-https.yml
tcp:
  routers:
    pass1-https:
      rule: HostSNI(`pass1.teste.techify.run`)
      service: pass1-service
      entryPoints: [websecure]
      tls:
        passthrough: true
  services:
    pass1-service:
      loadBalancer:
        servers:
          - address: 10.8.100.201:443
http:
  routers:
    pass1-http:
      rule: Host(`pass1.teste.techify.run`)
      service: pass1-http-service
      entryPoints: [web]
      priority: 1000
  services:
    pass1-http-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.201:80
```

## SSL Passthrough - HTTP Only

```yaml
# Generated using template: passthrough-http-only.yml
http:
  routers:
    pass-http-http:
      rule: Host(`pass-http.teste.techify.run`)
      service: pass-http-http-service
      entryPoints: [web]
  services:
    pass-http-http-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.202:80
```

## SSL Passthrough - Wildcard

```yaml
# Generated using template: passthrough-https.yml
tcp:
  routers:
    pass-wildcard-https:
      rule: HostSNIRegexp(`^.*.pass.techify.run$`)
      service: pass-wildcard-service
      entryPoints: [websecure]
      tls:
        passthrough: true
  services:
    pass-wildcard-service:
      loadBalancer:
        servers:
          - address: 10.8.100.203:443
http:
  routers:
    pass-wildcard-http:
      rule: HostRegexp(`^.*.pass.techify.run$`)
      service: pass-wildcard-http-service
      entryPoints: [web]
      priority: 1000
  services:
    pass-wildcard-http-service:
      loadBalancer:
        servers:
          - url: http://10.8.100.203:80
```

---

## Benefícios dos Comentários de Template

✅ **Rastreabilidade** - Fácil identificar qual template gerou o arquivo
✅ **Debugging** - Facilita troubleshooting e identificação de problemas
✅ **Documentação** - Serve como documentação inline do arquivo
✅ **Manutenção** - Ajuda a entender a estrutura ao editar manualmente
✅ **Auditoria** - Permite rastrear configurações e suas origens

## Compatibilidade

Os comentários em YAML são ignorados pelo parser, portanto:
- ✅ Totalmente compatível com Traefik
- ✅ Não afeta o funcionamento das configurações
- ✅ Pode ser lido e parseado normalmente pelo sistema
- ✅ Não adiciona overhead ou complexidade

---

**Última Atualização:** 2025-10-29
