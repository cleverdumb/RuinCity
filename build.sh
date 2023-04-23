if [ ! -d "db" ]; then
    mkdir db
    cd db
    touch data.db
    cd ..
fi

exit