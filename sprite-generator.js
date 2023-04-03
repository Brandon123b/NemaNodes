
//Static class contains tools to generate and manipulate nematode bodies 
class SpriteGenerator {

    //variables used for testing
    //In the future these will vary for each nematode
    //and will be derived from other properties of the nt
    static n_chunks = 7;
    static chunk_distance = 20;
    static chunk_y = 0;
    static bodyPartWidth = 32;
    static bodyPartHeight = 32;
    
    //Generate a texture that can then be either used as a sprite or attached to a rope
    //input: nematode to generate sprite for (currently doesn't matter)
    //output: a PIXI texture object
    static GenerateNematodeTexture(nematode) {
        
        //Calculate where to place each chunk sprite
        let points = [];
        let spriteCont = new PIXI.Container();

        let x = 0;
        for(let i=0; i<this.n_chunks; i++) {
            points.push([x, this.chunk_y]);
            x += this.chunk_distance;
        }

        //Place chunks
        for(let i=0;i<this.n_chunks; i++) {
            let chunk = PIXI.Sprite.from('Bibite.png');
            chunk.x = points[i][0];
            chunk.y = points[i][1];
            chunk.height = this.bodyPartHeight;
            chunk.width = this.bodyPartWidth;
            chunk.anchor.set(0.5);
            chunk.tint = Math.round(Math.random() * 0xFFFFFF);
            spriteCont.addChild(chunk);
        }

        //convert to a texture
        const image = app.renderer.extract.image(spriteCont, "image/png");

        //view the image in console (testing only)
        /*
        image.then(res => {
            console.log(res)
            document.body.appendChild(res)
        }, console.log)
        */
        return image;
    }

    //Generate the rope given a sprite
    //wip
    static GenerateNematodeRope(nematode) {
        return; 
    }

}