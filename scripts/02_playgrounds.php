<?php

$rootPath = dirname(__DIR__);
$json = json_decode(file_get_contents($rootPath . '/raw/playgrounds.json'), true);

$fc = [
    'type' => 'FeatureCollection',
    'features' => [],
];

foreach ($json['items'] as $point) {
    $f = [
        'type' => 'Feature',
        'properties' => [
            'id' => $point['ID'],
            'name' => $point['Name'],
            'type' => 'playground',
        ],
        'geometry' => [
            'type' => 'Point',
            'coordinates' => [
                floatval($point['Longitude']),
                floatval($point['Latitude']),
            ],
        ],
    ];
    $fc['features'][] = $f;
}

file_put_contents($rootPath . '/json/playgrounds.json', json_encode($fc, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
