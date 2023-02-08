<?php
include __DIR__ . '/vendor/autoload.php';

$rootPath = dirname(__DIR__);

$fc = [
    'type' => 'FeatureCollection',
    'features' => [],
];

foreach (glob($rootPath . '/raw/*_points.xml') as $xmlFile) {
    $xml = simplexml_load_file($xmlFile);
    foreach ($xml as $point) {
        $geo = geoPHP::load((string)$point->Geometry);
        $f = [
            'type' => 'Feature',
            'properties' => [
                'id' => (string)$point->StationID,
                'name' => (string)$point->StationName,
                'type' => 'point',
            ],
            'geometry' => json_decode($geo->out('json'), true),
        ];
        $fc['features'][] = $f;
    }
}

$lines = [];
foreach (glob($rootPath . '/raw/*_lines.xml') as $xmlFile) {
    $xml = simplexml_load_file($xmlFile);
    foreach ($xml as $line) {
        $key = (string)$line->LineID;
        if (!isset($lines[$key])) {
            $lines[$key] = geoPHP::load((string)$line->Geometry);
        } else {
            $lines[$key] = $lines[$key]->union(geoPHP::load((string)$line->Geometry));
        }
    }
}

foreach ($lines as $k => $line) {
    $f = [
        'type' => 'Feature',
        'properties' => [
            'id' => $k,
            'type' => 'line',
        ],
        'geometry' => json_decode($line->out('json'), true),
    ];
    $fc['features'][] = $f;
}

file_put_contents($rootPath . '/json/trans.json', json_encode($fc, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
