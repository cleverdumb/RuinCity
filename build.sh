if [ ! -d "db" ]; then
    mkdir db
    cd db
    cat > data.db
    cd ..
fi

exit