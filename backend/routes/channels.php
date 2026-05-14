<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('championship.{id}', fn () => true);
