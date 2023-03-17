/*
    Create a single SpriteGenerator for the world and use it to generate sprites. 
    WIP
*/


class SpriteGenerator {

    //Amplitude constraints
    static maxAmplitude = 200;
    static minAmplitude = 100;
    //Wavelength constraints
    static maxFrequency = 2;
    static minFrequency = 0.5;
    //Constraint on number of body parts
    static minBodyParts = 4;
    static maxBodyParts = 20

    //Spacing between body parts
    //Might make this a range too idk
    static bodyPartSpacing = 80;

    static baseBodyPartHeight = 128;
    static baseBodyPartWidth = 128;

    //internal
    //return a random decimal between min and max
    static rand_dec(min, max) {

        return Math.random() * (max-min) + min;
    }


    //Generate a new sprite with no parent info
    static async NewSpriteRandom() {
        
        await PIXI.Assets.load('Bibite.png');

        //create random parameters
        var amplitude = this.rand_dec(this.minAmplitude, this.maxAmplitude);
        var frequency = this.rand_dec(this.minFrequency, this.maxFrequency);
        var n_parts = Math.floor(this.rand_dec(this.minBodyParts, this.maxBodyParts));
        var x_head = 0; //x point to start generating at; might need to tweak

        console.log(amplitude, frequency, n_parts, x_head);
        //generate body part postions
        var sample_x = Array(n_parts);
        var sample_y = Array(sample_x.length);
        var xpos = x_head; 

        //Choose samples from the sine curve
        //TODO: Samples shouldn't be separated by the fixed x
        //but instead should be equidistant wrt arc length
        for(var i=0;i<sample_y.length;i++) {
            sample_x[i] = xpos;
            //sample_y[i] = i;
            sample_y[i] = amplitude * Math.cos( frequency * sample_x[i] );
            xpos += this.bodyPartSpacing;
        }
        console.log(sample_x, sample_y);
        var spriteCont = new PIXI.Container;

        for(var i=0; i<sample_x.length;i++) {
            var chunk = PIXI.Sprite.from('Bibite.png');
            //place body part
            //TODO: make sprite body parts
            //TODO: different body parts for head and tail
            //TODO: will probably need to scale the sprites
            chunk.x = sample_x[i];
            chunk.y = sample_y[i];
            chunk.width = this.baseBodyPartWidth;
            chunk.height = this.baseBodyPartHeight;
            //Get rotation
            if(i==0) {
                //how to rotate the head?
                console.log("head");
            }
            else{
                //align the body part to point
                //to the part in front of it
                var front_x = sample_x[i-1];
                var front_y = sample_y[i-1];
                var dx = sample_x[i] - sample_x[i-1];
                var dy = sample_y[i] - sample_y[i-1];
                var rot = Math.atan(dy/dx);
                chunk.rotation = rot;


            }
            
            //set anchor and add to container
            chunk.anchor.set(0.5);
            spriteCont.addChild(chunk);
        }

        const image = app.renderer.extract.image(spriteCont, "image/png", height=256, width=256);
        
        //view the image in console (testing only)
        image.then(res => {
            console.log(res)
            document.body.appendChild(res)
            }, console.log)
        

        //return PIXI.Sprite.from(image);
        return 0;

    }

     
    //Generate child sprite from parent
    //TODO
    //Plan: Take params from parent, add a random offset for each
    //then do NewSpriteRandom() with that
    static NewSpriteFromParent(parent) {
        return 0
    }

    

}