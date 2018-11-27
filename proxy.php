<?php
//■PHPプロキシ
//使用方法: http://example.com/proxy.php?url=対象URL
//動作条件: php.iniの「allow_url_fopen」が有効であること。クッキーは無視されます


//PHPの実行時間制限(単位は秒、0で無制限)
//ini_set("max_execution_time", 60*60*24);

//バッファ無効化
while(ob_get_level()){ ob_end_clean(); }

if(!isset($_GET['url']) or !preg_match("|^https?://|i", $_GET['url'])){
    error400();
}

$request_header = "";

foreach(getallheaders() as $k => $v){
    if(preg_match("/^(Host|Cookie)$/i", $k)){
        continue;
    }
    $request_header .= "$k: $v\r\n";
}

$context = stream_context_create([
    'http' => [
        'method'  => $_SERVER['REQUEST_METHOD'],
        'header'  => $request_header,
        'content' => file_get_contents("php://input"),
    ]
]);

$fp = @fopen($_GET['url'], 'rb', false, $context);
if($fp === false){
    error400();
}

foreach(array_reverse(stream_get_meta_data($fp)['wrapper_data']) as $v){
    if(preg_match("/^Set-Cookie/i", $v)){
        continue;
    }
    else if(preg_match("/^Access-Control-Allow-Origin/i", $v)){
        continue;
    }
    else if(preg_match("|^HTTP/|i", $v)){
        break;
    }
    header($v);
}
header("Access-Control-Allow-Origin: *");


while(!feof($fp)){
    print fread($fp, 8192);
}


function error400(){
    header('HTTP', true, 400);
    exit;
}
