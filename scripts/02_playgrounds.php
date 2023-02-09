<?php

$rootPath = dirname(__DIR__);
$rawPath = $rootPath . '/raw/playground';
if (!file_exists($rawPath)) {
    mkdir($rawPath, 0777, true);
}
$json = json_decode(file_get_contents($rootPath . '/raw/playgrounds.json'), true);

$fc = [
    'type' => 'FeatureCollection',
    'features' => [],
];

foreach ($json['items'] as $point) {
    $rawFile = $rawPath . '/' . $point['ID'] . '.html';
    if (!file_exists($rawFile)) {
        file_put_contents($rawFile, file_get_contents('https://pwbmo.kcg.gov.tw/InclusivePlaygroundDetail.aspx?Cond=' . $point['ID']));
    }
    $data = [
        'id' => $point['ID'],
        'name' => $point['Name'],
        'type' => 'playground',
    ];
    $raw = file_get_contents($rawFile);
    $pos = strpos($raw, '<div class="playGround_wrap">');
    $pos = strpos($raw, 'FileDownLoad/InclusivePlayground/', $pos);
    $posEnd = strpos($raw, '"', $pos);
    $data['cover'] = substr($raw, $pos, $posEnd - $pos);
    $pos = strpos($raw, '遊具設施：', $posEnd);
    $posEnd = strpos($raw, '</span>', $pos);
    $line = explode('：', substr($raw, $pos, $posEnd - $pos));
    $data['ages'] = '';
    if (isset($line[1])) {
        $data['ages'] = $line[1];
    }

    $pos = strpos($raw, '<ul class="mt-2">', $posEnd);
    $posEnd = strpos($raw, '<div class="text-dark my-3 my-md-4">', $pos);
    $parts = explode('</li>', substr($raw, $pos, $posEnd - $pos));
    foreach ($parts as $k => $v) {
        $line = explode('：', trim(strip_tags($v)));
        if (isset($line[1])) {
            $parts[$k] = trim(explode('：', trim(strip_tags($v)))[1]);
        } else {
            $parts[$k] = '';
        }
    }
    if (!empty($parts[0])) {
        $data['address'] = $parts[0];
        $data['date_created'] = $parts[1];
        $data['maintainer'] = $parts[2];
        $data['phone'] = $parts[3];
    }

    $f = [
        'type' => 'Feature',
        'properties' => $data,
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
