// Configuração para Hot Reload Seguro
module.exports = {
  // Habilitar hot reload sem reiniciar servidor
  hot: true,
  // Evitar reinício completo em mudanças
  liveReload: false,
  // Limpar cache apenas quando necessário
  clearCacheOnReload: false,
  // Timeout para hot reload
  reloadTimeout: 300,
  // Ignorar arquivos que não precisam de reload
  ignore: [
    /node_modules/,
    /.git/,
    /.expo/,
    /dist/,
    /build/
  ],
  // Porta fixa para evitar conflitos
  port: 19006,
  // Ambiente de desenvolvimento
  mode: 'development'
};
