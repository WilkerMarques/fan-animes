<?php

function todayStatDate(): string
{
    return (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d');
}
