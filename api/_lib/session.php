<?php
const COOKIE_NAME = 'fan_dashboard_session';

function getSecret() {
    $s = getConfig('cookie_secret');
    if (empty($s)) {
        throw new RuntimeException('cookie_secret não configurado');
    }
    return $s;
}

function sign($value) {
    return hash_hmac('sha256', $value, getSecret());
}

function createSessionToken() {
    $payload = json_encode(['ok' => true, 'ts' => time() * 1000]);
    $base = strtr(base64_encode($payload), '+/', '-_');
    $base = rtrim($base, '=');
    $sig = sign($base);
    return $base . '.' . $sig;
}

function isValidSessionToken($token) {
    if (empty($token) || strpos($token, '.') === false) {
        return false;
    }
    list($base, $sig) = explode('.', $token, 2);
    if (sign($base) !== $sig) {
        return false;
    }
    $raw = base64_decode(strtr($base, '-_', '+/'));
    $json = json_decode($raw, true);
    if (!isset($json['ok'], $json['ts']) || !$json['ok']) {
        return false;
    }
    $ageMs = (time() * 1000) - (int) $json['ts'];
    $maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 dias
    return $ageMs <= $maxAgeMs;
}

function getCookieValue($name) {
    if (empty($_COOKIE[$name])) {
        return null;
    }
    return $_COOKIE[$name];
}

function isAuthenticated() {
    $token = getCookieValue(COOKIE_NAME);
    return $token && isValidSessionToken($token);
}

function buildSessionCookie($token) {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? '; Secure' : '';
    return COOKIE_NAME . '=' . $token . '; Path=/; HttpOnly; SameSite=Lax' . $secure . '; Max-Age=604800';
}

function buildLogoutCookie() {
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? '; Secure' : '';
    return COOKIE_NAME . '=; Path=/; HttpOnly; SameSite=Lax' . $secure . '; Max-Age=0';
}
