<?php
// Configuração local – banco e senha do dashboard
return [
    'db_host'     => 'localhost',
    'db_name'     => 'fan-animes-local',
    'db_user'     => 'root',
    'db_password' => '9090',  // coloque a senha do MySQL aqui (deixe '' se for sem senha)
    'dashboard_password' => 'admin123',  // senha para acessar o dashboard – troque se quiser
    'cookie_secret' => 'fan-animes-cookie-secret-local-dev-123',
    'pix_chave_aleatoria' => '4f3cae94-25e2-4c8e-ba03-ac0bc37b2ead',
    'pix_receiver_name'   => 'Fan Animes',
    'pix_receiver_city'   => 'Campo Grande',
];
